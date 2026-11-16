import logging
from collections.abc import Callable

from django.db import transaction

from apps.consulta_ia.ai.context.builder import ContextBuilder
from apps.consulta_ia.ai.context.summarizer import ClinicalSummarizer, render_summary
from apps.consulta_ia.ai.contracts import AIMessage, AIProvider, AIRequest
from apps.consulta_ia.ai.schemas import ClinicalSummary
from apps.consulta_ia.application.dto import ROLE_POR_REMETENTE
from apps.consulta_ia.application.interactions import InteractionTracker
from apps.consulta_ia.domain.exceptions import (
    ConsultaIAError,
    InputTooLongError,
    InvalidMessageError,
    SimulationClosedError,
)
from apps.consulta_ia.models import InteracaoIA, MensagemSimulacao, SimulacaoConsulta

logger = logging.getLogger(__name__)


class SendPatientMessage:
    def __init__(
        self,
        provider: AIProvider,
        build_instructions: Callable[[str, str], str],
        context_builder: ContextBuilder,
        summarizer: ClinicalSummarizer | None = None,
        tracker: InteractionTracker | None = None,
        max_output_tokens: int = 300,
        temperature: float = 0.8,
        max_message_chars: int = 1000,
    ):
        self._provider = provider
        self._build_instructions = build_instructions
        self._context = context_builder
        self._summarizer = summarizer
        self._tracker = tracker or InteractionTracker()
        self._max_output_tokens = max_output_tokens
        self._temperature = temperature
        self._max_message_chars = max_message_chars

    def execute(self, simulacao: SimulacaoConsulta, mensagem) -> MensagemSimulacao:
        if not simulacao.ativa:
            raise SimulationClosedError()

        if not isinstance(mensagem, str) or not mensagem.strip():
            raise InvalidMessageError("Mensagem ausente, vazia ou não textual.")

        texto = mensagem.strip()
        if len(texto) > self._max_message_chars:
            raise InputTooLongError(
                f"Mensagem com {len(texto)} caracteres (limite {self._max_message_chars})."
            )

        interacao = self._tracker.begin(simulacao, InteracaoIA.Tipo.MENSAGEM)
        try:
            resposta = self._gerar_resposta(simulacao, texto)
            with transaction.atomic():
                MensagemSimulacao.objects.create(
                    simulacao=simulacao, remetente="fisio", conteudo=texto
                )
                mensagem_paciente = MensagemSimulacao.objects.create(
                    simulacao=simulacao, remetente="paciente", conteudo=resposta.content
                )
                self._tracker.complete(
                    interacao,
                    modelo=resposta.model,
                    tokens_entrada=resposta.input_tokens,
                    tokens_saida=resposta.output_tokens,
                )
        except Exception as exc:
            self._tracker.fail(interacao, exc)
            raise

        return mensagem_paciente

    def _gerar_resposta(self, simulacao, texto):
        instrucoes_base = self._build_instructions(
            simulacao.nivel, simulacao.patologia_simulada
        )
        resumo = ClinicalSummary.model_validate(simulacao.resumo_clinico or {})

        limite = simulacao.resumo_ate_mensagem_id or 0
        pendentes = list(
            simulacao.mensagens.filter(id__gt=limite).order_by("-id")[
                : self._context.max_messages * 2
            ]
        )
        pendentes.reverse()
        
        historico = tuple(
            AIMessage(ROLE_POR_REMETENTE[m.remetente], m.conteudo) for m in pendentes
        ) + (AIMessage("user", texto),)

        contexto = self._context.build(historico, instrucoes_base + render_summary(resumo))

        if contexto.dropped_messages and self._summarizer:
            resumo, contexto = self._compactar(
                simulacao, instrucoes_base, resumo, pendentes, historico, contexto
            )
        if contexto.dropped_messages:
            logger.info(
                "Contexto reduzido: simulacao=%s descartadas=%s tokens_estimados=%s",
                simulacao.pk, contexto.dropped_messages, contexto.estimated_tokens,
            )

        return self._provider.generate(
            AIRequest(
                instructions=instrucoes_base + render_summary(resumo),
                messages=contexto.messages,
                max_output_tokens=self._max_output_tokens,
                temperature=self._temperature,
            )
        )

    def _compactar(self, simulacao, instrucoes_base, resumo, pendentes, historico, contexto):
        manter = max(1, len(contexto.messages) // 2)
        try:
            novo = self._summarizer.update(resumo, historico[:-manter])
        except ConsultaIAError as exc:
            logger.warning("Resumo clínico falhou (simulacao=%s): %s", simulacao.pk, exc)
            return resumo, contexto

        simulacao.resumo_clinico = novo.model_dump(mode="json")
        simulacao.resumo_ate_mensagem_id = pendentes[len(historico) - manter - 1].id
        simulacao.save(update_fields=["resumo_clinico", "resumo_ate_mensagem_id"])

        contexto = self._context.build(historico, instrucoes_base + render_summary(novo))
        return novo, contexto