import logging

from collections.abc import Callable

from apps.consulta_ia.ai.contracts import AIMessage, AIProvider, AIRequest
from apps.consulta_ia.domain.exceptions import (
    InvalidMessageError,
    SimulationClosedError,
)
from apps.consulta_ia.models import MensagemSimulacao, SimulacaoConsulta
from apps.consulta_ia.ai.context.builder import ContextBuilder

logger = logging.getLogger(__name__)

_ROLE_POR_REMETENTE = {"fisio": "user", "paciente": "assistant"}


class SendPatientMessage:
    def __init__(
        self,
        provider: AIProvider,
        build_instructions: Callable[[str, str], str],
        context_builder: ContextBuilder,
        max_output_tokens: int = 300,
        temperature: float = 0.8,
    ):
        self._provider = provider
        self._build_instructions = build_instructions
        self._context = context_builder
        self._max_output_tokens = max_output_tokens
        self._temperature = temperature

    def execute(self, simulacao: SimulacaoConsulta, mensagem) -> MensagemSimulacao:
        if not simulacao.ativa:
            raise SimulationClosedError()

        if not isinstance(mensagem, str) or not mensagem.strip():
            raise InvalidMessageError("Mensagem ausente, vazia ou não textual.")

        MensagemSimulacao.objects.create(
            simulacao=simulacao, remetente="fisio", conteudo=mensagem.strip()
        )

        recentes = list(
            simulacao.mensagens.order_by("-criado_em", "-id")[: self._context.max_messages]
        )
        recentes.reverse()
        historico = tuple(
            AIMessage(_ROLE_POR_REMETENTE[m.remetente], m.conteudo) for m in recentes
        )

        instrucoes = self._build_instructions(
            simulacao.nivel, simulacao.patologia_simulada
        )
        contexto = self._context.build(historico, instrucoes)
        if contexto.dropped_messages:
            logger.info(
                "Contexto reduzido: simulacao=%s descartadas=%s tokens_estimados=%s",
                simulacao.pk, contexto.dropped_messages, contexto.estimated_tokens,
            )

        request = AIRequest(
            instructions=instrucoes,
            messages=contexto.messages,
            max_output_tokens=self._max_output_tokens,
            temperature=self._temperature,
        )

        resposta = self._provider.generate(request)

        return MensagemSimulacao.objects.create(
            simulacao=simulacao, remetente="paciente", conteudo=resposta.content
        )