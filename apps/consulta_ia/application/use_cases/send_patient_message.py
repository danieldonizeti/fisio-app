from collections.abc import Callable

from apps.consulta_ia.ai.contracts import AIMessage, AIProvider, AIRequest
from apps.consulta_ia.domain.exceptions import (
    InvalidMessageError,
    SimulationClosedError,
)
from apps.consulta_ia.models import MensagemSimulacao, SimulacaoConsulta

_ROLE_POR_REMETENTE = {"fisio": "user", "paciente": "assistant"}


class SendPatientMessage:
    def __init__(
        self,
        provider: AIProvider,
        build_instructions: Callable[[str, str], str],
        max_output_tokens: int = 300,
        temperature: float = 0.8,
    ):
        self._provider = provider
        self._build_instructions = build_instructions
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

        historico = tuple(
            AIMessage(_ROLE_POR_REMETENTE[m.remetente], m.conteudo)
            for m in simulacao.mensagens.all()
        )
        request = AIRequest(
            instructions=self._build_instructions(
                simulacao.nivel, simulacao.patologia_simulada
            ),
            messages=historico,
            max_output_tokens=self._max_output_tokens,
            temperature=self._temperature,
        )

        resposta = self._provider.generate(request)

        return MensagemSimulacao.objects.create(
            simulacao=simulacao, remetente="paciente", conteudo=resposta.content
        )