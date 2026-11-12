import pytest
import json

from apps.consulta_ia.application.use_cases.send_patient_message import SendPatientMessage
from apps.consulta_ia.domain.exceptions import (
    AIProviderError,
    InvalidMessageError,
    SimulationClosedError,
)
from apps.consulta_ia.models import MensagemSimulacao
from apps.consulta_ia.ai.context.builder import ContextBuilder
from apps.consulta_ia.ai.context.summarizer import ClinicalSummarizer, SUMMARIZER_INSTRUCTIONS
from apps.consulta_ia.ai.contracts import AIResponse
from apps.consulta_ia.domain.exceptions import AIProviderError, InputTooLongError

RESUMO_JSON = json.dumps({"facts": {"lado_afetado": {"value": "ombro direito"}}})


class ProvedorRoteado:
    """RESPONSE JSON ao resumidor e texto comum ao paciente. """
    def __init__(self, falhar_no_resumo=False):
        self.requisicoes = []
        self.falhar_no_resumo = falhar_no_resumo


    def generate(self, request):
        self.requisicoes.append(request)
        if request.instructions == SUMMARIZER_INSTRUCTIONS:
            if self.falhar_no_resumo:
                raise AIProviderError("falha no resumo")
            return AIResponse(content=RESUMO_JSON, model="falso")
        return AIResponse(content="Resposta do paciente", model="falso")


def criar_caso(provedor, max_messages=4):
    return SendPatientMessage(
        provider=provedor,
        build_instructions=instrucoes,
        context_builder=ContextBuilder(max_input_tokens=10_000, max_messages=max_messages),
        summarizer=ClinicalSummarizer(provedor),
    )


def popular(simulacao, n):
    for i in range(n):
        MensagemSimulacao.objects.create(
            simulacao=simulacao,
            remetente="fisio" if i % 2 == 0 else "paciente",
            conteudo=f"mensagem {i}",
        )


@pytest.mark.django_db
def test_compacta_quando_a_janela_nao_comporta_o_historico(simulacao):
    popular(simulacao, 10)
    provedor = ProvedorRoteado()

    criar_caso(provedor).execute(simulacao, "mensagem nova")

    simulacao.refresh_from_db()
    assert simulacao.resumo_clinico["facts"]["lado_afetado"]["value"] == "ombro direito"
    assert simulacao.resumo_ate_mensagem_id is not None
    assert len(provedor.requisicoes) == 2  # resumidor + paciente
    assert "ombro direito" in provedor.requisicoes[-1].instructions


@pytest.mark.django_db
def test_nao_chama_o_resumidor_quando_tudo_cabe(simulacao):
    popular(simulacao, 2)
    provedor = ProvedorRoteado()

    criar_caso(provedor).execute(simulacao, "mensagem nova")

    simulacao.refresh_from_db()
    assert len(provedor.requisicoes) == 1
    assert simulacao.resumo_ate_mensagem_id is None


@pytest.mark.django_db
def test_falha_no_resumo_nao_derruba_a_resposta(simulacao):
    popular(simulacao, 10)
    provedor = ProvedorRoteado(falhar_no_resumo=True)

    resposta = criar_caso(provedor).execute(simulacao, "mensagem nova")

    simulacao.refresh_from_db()
    assert resposta.conteudo == "Resposta do paciente"
    assert simulacao.resumo_ate_mensagem_id is None


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
    assert simulacao.mensagens.count() == 8


@pytest.mark.django_db
def test_mensagem_acima_do_limite_nao_salva_nada(simulacao, ia_falsa):
    caso = SendPatientMessage(
        provider=ia_falsa,
        build_instructions=instrucoes,
        context_builder=ContextBuilder(max_input_tokens=10_000, max_messages=50),
        max_message_chars=10,
    )
    with pytest.raises(InputTooLongError):
        caso.execute(simulacao, "x" * 11)
    assert MensagemSimulacao.objects.count() == 0
    assert ia_falsa.requisicoes == []