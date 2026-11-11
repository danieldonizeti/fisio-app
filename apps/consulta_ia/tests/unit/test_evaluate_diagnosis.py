import pytest

from apps.consulta_ia.application.use_cases.evaluate_diagnosis import EvaluateDiagnosis
from apps.consulta_ia.domain.exceptions import AIProviderError, InvalidDiagnosisError
from apps.consulta_ia.models import MensagemSimulacao


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