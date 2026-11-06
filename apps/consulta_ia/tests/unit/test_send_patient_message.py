import pytest

from apps.consulta_ia.application.use_cases.send_patient_message import SendPatientMessage
from apps.consulta_ia.domain.exceptions import (
    AIProviderError,
    InvalidMessageError,
    SimulationClosedError,
)
from apps.consulta_ia.models import MensagemSimulacao
from apps.consulta_ia.ai.context.builder import ContextBuilder


@pytest.fixture
def caso_de_uso(ia_falsa):
    return SendPatientMessage(
        provider=ia_falsa,
        build_instructions=instrucoes,
        context_builder=ContextBuilder(max_input_tokens=10_000, max_messages=50),
    )


def instrucoes(nivel, patologia):
    return f"nivel={nivel};patologia={patologia}"


@pytest.mark.django_db
def test_salva_as_duas_mensagens_e_retorna_a_do_paciente(caso_de_uso, simulacao):
    resposta = caso_de_uso.execute(simulacao, "  Onde dói?  ")
    assert resposta.remetente == "paciente"
    mensagens = list(simulacao.mensagens.all())
    assert [(m.remetente, m.conteudo) for m in mensagens] == [
        ("fisio", "Onde dói?"),
        ("paciente", "Dói quando levanto o braço, doutor."),
    ]


@pytest.mark.django_db
def test_monta_o_request_com_roles_e_instrucoes(caso_de_uso, simulacao, ia_falsa):
    MensagemSimulacao.objects.create(simulacao=simulacao, remetente="fisio", conteudo="Oi")
    MensagemSimulacao.objects.create(simulacao=simulacao, remetente="paciente", conteudo="Olá")

    caso_de_uso.execute(simulacao, "Onde dói?")

    req = ia_falsa.requisicoes[0]
    assert [(m.role, m.content) for m in req.messages] == [
        ("user", "Oi"),
        ("assistant", "Olá"),
        ("user", "Onde dói?"),
    ]
    assert req.instructions == "nivel=facil;patologia=Tendinite do supraespinhal"
    assert req.max_output_tokens == 300


@pytest.mark.django_db
def test_simulacao_finalizada_levanta_erro_sem_salvar_nada(caso_de_uso, simulacao):
    simulacao.ativa = False
    simulacao.save()
    with pytest.raises(SimulationClosedError):
        caso_de_uso.execute(simulacao, "oi")
    assert MensagemSimulacao.objects.count() == 0


@pytest.mark.django_db
@pytest.mark.parametrize("valor", ["", "   ", None, 42])
def test_mensagem_invalida_levanta_erro(caso_de_uso, simulacao, valor):
    with pytest.raises(InvalidMessageError):
        caso_de_uso.execute(simulacao, valor)
    assert MensagemSimulacao.objects.count() == 0


@pytest.mark.django_db
def test_falha_da_ia_nao_cria_mensagem_do_paciente(caso_de_uso, simulacao, ia_falsa):
    ia_falsa.erro = AIProviderError("boom")
    with pytest.raises(AIProviderError):
        caso_de_uso.execute(simulacao, "oi")
    # Comportamento atual, a ser revisto no PR 7: a mensagem do fisio fica salva.
    assert [m.remetente for m in simulacao.mensagens.all()] == ["fisio"]


@pytest.mark.django_db
def test_envia_apenas_a_janela_recente_mas_o_banco_guarda_tudo(simulacao, ia_falsa):
    for i in range(6):
        MensagemSimulacao.objects.create(
            simulacao=simulacao,
            remetente="fisio" if i % 2 == 0 else "paciente",
            conteudo=f"mensagem {i}",
        )
    caso = SendPatientMessage(
        provider=ia_falsa,
        build_instructions=instrucoes,
        context_builder=ContextBuilder(max_input_tokens=10_000, max_messages=3),
    )

    caso.execute(simulacao, "mensagem nova")

    enviadas = [m.content for m in ia_falsa.requisicoes[0].messages]
    assert enviadas == ["mensagem 4", "mensagem 5", "mensagem nova"]
    assert simulacao.mensagens.count() == 8  # 6 + nova + resposta da IA