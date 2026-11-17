from dataclasses import dataclass

from django.utils import timezone
from django.db import transaction

from apps.consulta_ia.ai.contracts import AIMessage, AIRequest, StructuredAIProvider
from apps.consulta_ia.ai.prompts.diagnosis_evaluator import (
    build_evaluator_input,
    build_evaluator_instructions,
)
from apps.consulta_ia.ai.schemas import DiagnosisEvaluation
from apps.consulta_ia.application.dto import ROLE_POR_REMETENTE
from apps.consulta_ia.domain.exceptions import InvalidDiagnosisError, InputTooLongError, SimulationClosedError
from apps.consulta_ia.models import SimulacaoConsulta, InteracaoIA
from apps.consulta_ia.application.use_cases.send_patient_message import InteractionTracker

_ROTULO_VEREDITO = {
    "correto": "Você acertou o diagnóstico.",
    "proximo": "Você ficou próximo do diagnóstico real.",
    "incorreto": "Você não acertou o diagnóstico.",
}


@dataclass(frozen=True)
class DiagnosisResult:
    patologia_real: str
    diagnostico_submetido: str
    avaliacao: DiagnosisEvaluation

    @property
    def feedback(self) -> str:
        return (
            f"1. **Resultado**: {_ROTULO_VEREDITO[self.avaliacao.veredito]}\n"
            f"2. **Análise Clínica**: {self.avaliacao.analise_clinica}\n"
            f"3. **Dica do Professor**: {self.avaliacao.dica_do_professor}"
        )


class EvaluateDiagnosis:
    def __init__(
        self,
        provider: StructuredAIProvider,
        max_output_tokens: int = 1024,
        temperature: float = 0.3,
        max_diagnosis_chars: int = 300,
        tracker: InteractionTracker | None = None
    ):
        self._provider = provider
        self._max_output_tokens = max_output_tokens
        self._temperature = temperature
        self._max_diagnosis_chars = max_diagnosis_chars
        self._tracker = tracker or InteractionTracker()

    def execute(self, simulacao: SimulacaoConsulta, diagnostico) -> DiagnosisResult:
        if not simulacao.ativa:
            raise SimulationClosedError()

        if not isinstance(diagnostico, str) or not diagnostico.strip():
            raise InvalidDiagnosisError("Diagnóstico ausente, vazio ou não textual.")
        
        diagnostico = diagnostico.strip()

        if len(diagnostico) > self._max_diagnosis_chars:
            raise InputTooLongError(
                f"Diagnostico com {len(diagnostico)} caracteres (limite de {self._max_diagnosis_chars})"
            )

        mensagens = tuple(
            AIMessage(ROLE_POR_REMETENTE[m.remetente], m.conteudo)
            for m in simulacao.mensagens.all()
        )
        request = AIRequest(
            instructions=build_evaluator_instructions(simulacao.patologia_simulada),
            messages=(AIMessage("user", build_evaluator_input(diagnostico, mensagens)),),
            max_output_tokens=self._max_output_tokens,
            temperature=self._temperature,
        )

        interacao = self._tracker.begin(simulacao, InteracaoIA.Tipo.DIAGNOSTICO)
        try:
            resposta = self._provider.generate_structured(request, DiagnosisEvaluation)
            with transaction.atomic():
                simulacao.ativa = False
                simulacao.finalizado_em = timezone.now()
                simulacao.save(update_fields=["ativa", "finalizado_em"])
                self._tracker.complete(
                    interacao,
                    modelo=resposta.model,
                    tokens_entrada=resposta.input_tokens,
                    tokens_saida=resposta.output_tokens,
                )
        except Exception as exc:
            self._tracker.fail(interacao, exc)
            raise

        return DiagnosisResult(
            patologia_real=simulacao.patologia_simulada,
            diagnostico_submetido=diagnostico,
            avaliacao=resposta.parsed,
        )