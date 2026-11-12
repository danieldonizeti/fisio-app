import logging

from collections.abc import Callable

from apps.consulta_ia.ai.contracts import AIMessage, AIProvider, AIRequest
from apps.consulta_ia.domain.exceptions import (
    InvalidMessageError,
    SimulationClosedError,
    ConsultaIAError,
    InputTooLongError,
)
from apps.consulta_ia.models import MensagemSimulacao, SimulacaoConsulta
from apps.consulta_ia.ai.context.builder import ContextBuilder
from apps.consulta_ia.ai.schemas import ClinicalSummary
from apps.consulta_ia.ai.context.summarizer import ClinicalSummarizer, render_summary
from apps.consulta_ia.application.dto import ROLE_POR_REMETENTE


logger = logging.getLogger(__name__)

_ROLE_POR_REMETENTE = ROLE_POR_REMETENTE


class SendPatientMessage:
    def __init__(
        self,
        provider: AIProvider,
        build_instructions: Callable[[str, str], str],
        context_builder: ContextBuilder,
        summarizer: ClinicalSummarizer | None = None,
        max_output_tokens: int = 300,
        temperature: float = 0.8,
        max_message_chars: int = 1000,
    ):
        self._provider = provider
        self._build_instructions = build_instructions
        self._context = context_builder
        self._summarizer = summarizer
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
                f"Mensagem com {len(texto)} caracteres (limite {self._max_message_chars})"
            )

        MensagemSimulacao.objects.create(
            simulacao=simulacao, remetente="fisio", conteudo=texto
        )

        recentes = list(
            simulacao.mensagens.order_by("-criado_em", "-id")[: self._context.max_messages]
        )
        recentes.reverse()
        historico = tuple(
            AIMessage(_ROLE_POR_REMETENTE[m.remetente], m.conteudo) for m in recentes
        )

        instrucoes_base = self._build_instructions(
            simulacao.nivel, simulacao.patologia_simulada
        )
        resumo = ClinicalSummary.model_validate(simulacao.resumo_clinico or {})

        # Mensagens posteriores ao último resumo (com folga para haver o que resumir).
        limite = simulacao.resumo_ate_mensagem_id or 0
        pendentes = list(
            simulacao.mensagens.filter(id__gt=limite).order_by("-id")[
                : self._context.max_messages * 2
            ]
        )
        pendentes.reverse()
        historico = tuple(
            AIMessage(_ROLE_POR_REMETENTE[m.remetente], m.conteudo) for m in pendentes
        )

        contexto = self._context.build(historico, instrucoes_base + render_summary(resumo))

        if contexto.dropped_messages and self._summarizer:
            resumo, contexto = self._compactar(
                simulacao, instrucoes_base, resumo, pendentes, historico, contexto
            )

        request = AIRequest(
            instructions=instrucoes_base + render_summary(resumo),
            messages=contexto.messages,
            max_output_tokens=self._max_output_tokens,
            temperature=self._temperature,
        )

        resposta = self._provider.generate(request)

        return MensagemSimulacao.objects.create(
            simulacao=simulacao, remetente="paciente", conteudo=resposta.content
        )


    def _compactar(self, simulacao, instrucoes_base, resumo, pendentes, historico, contexto):
        manter = max(1, len(contexto.messages) // 2)
        try:
            novo = self._summarizer.update(resumo, historico[:-manter])
        except ConsultaIAError as exc:
            logger.warning("Resumo clínico falhou (simulacao=%s): %s", simulacao.pk, exc)
            return resumo, contexto  # segue sem resumir; a resposta não quebra

        simulacao.resumo_clinico = novo.model_dump(mode="json")
        simulacao.resumo_ate_mensagem_id = pendentes[-manter - 1].id
        simulacao.save(update_fields=["resumo_clinico", "resumo_ate_mensagem_id"])

        contexto = self._context.build(historico, instrucoes_base + render_summary(novo))
        return novo, contexto