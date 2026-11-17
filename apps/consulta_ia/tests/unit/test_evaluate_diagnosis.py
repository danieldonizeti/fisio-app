import pytest

from apps.consulta_ia.application.use_cases.evaluate_diagnosis import EvaluateDiagnosis
from apps.consulta_ia.domain.exceptions import AIProviderError, InvalidDiagnosisError, InputTooLongError, SimulationClosedError
from apps.consulta_ia.models import MensagemSimulacao, InteracaoIA



@pytest.mark.django_db
def test_avalia_finaliza_e_monta_o_feedback(simulacao, ia_falsa):
    MensagemSimulacao.objects.create(simulacao=simulacao, remetente="fisio", conteudo="Onde dói?")

    resultado = EvaluateDiagnosis(ia_falsa).execute(simulacao, "  tendinite  ")

    simulacao.refresh_from_db()
    assert simulacao.ativa is False and simulacao.finalizado_em is not None
    assert resultado.diagnostico_submetido == "tendinite"
    assert resultado.patologia_real == "Tendinite do supraespinhal"
    assert resultado.feedback.startswith("1. **Resultado**: Você ficou próximo")
    req = ia_falsa.requisicoes[0]
    assert "Tendinite do supraespinhal" in req.instructions
    assert "Tendinite do supraespinhal" not in req.messages[0].content


@pytest.mark.django_db
def test_falha_da_ia_nao_finaliza_a_simulacao(simulacao, ia_falsa):
    ia_falsa.erro = AIProviderError("boom")
    with pytest.raises(AIProviderError):
        EvaluateDiagnosis(ia_falsa).execute(simulacao, "tendinite")
    simulacao.refresh_from_db()
    assert simulacao.ativa is True
    assert simulacao.finalizado_em is None


@pytest.mark.django_db
@pytest.mark.parametrize("valor", ["", "   ", None, 42])
def test_diagnostico_invalido_nao_chama_a_ia(simulacao, ia_falsa, valor):
    with pytest.raises(InvalidDiagnosisError):
        EvaluateDiagnosis(ia_falsa).execute(simulacao, valor)
    assert ia_falsa.requisicoes == []


@pytest.mark.django_db
def test_simulacao_ja_finalizada_nao_chama_a_ia(simulacao, ia_falsa):
    simulacao.ativa = False
    simulacao.save()
    with pytest.raises(SimulationClosedError):
        EvaluateDiagnosis(ia_falsa).execute(simulacao, "tendinite")
    assert ia_falsa.requisicoes == []


@pytest.mark.django_db
def test_diagnostico_acima_do_limite_levanta_erro(simulacao, ia_falsa):
    with pytest.raises(InputTooLongError):
        EvaluateDiagnosis(ia_falsa, max_diagnosis_chars=10).execute(simulacao, "x" * 11)
    assert ia_falsa.requisicoes == []


@pytest.mark.django_db
def test_falha_marca_a_interacao_como_falhou(simulacao, ia_falsa):
    ia_falsa.erro = AIProviderError("boom")
    with pytest.raises(AIProviderError):
        EvaluateDiagnosis(ia_falsa).execute(simulacao, "tendinite")
    assert InteracaoIA.objects.get().estado == "falhou"


@pytest.mark.django_db
def test_sucesso_conclui_a_interacao_e_a_simulacao_juntas(simulacao, ia_falsa):
    EvaluateDiagnosis(ia_falsa).execute(simulacao, "tendinite")
    simulacao.refresh_from_db()
    assert simulacao.ativa is False
    assert InteracaoIA.objects.get().estado == "concluida"