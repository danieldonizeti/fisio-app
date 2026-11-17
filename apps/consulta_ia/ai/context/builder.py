from collections.abc import Sequence
from dataclasses import dataclass

from apps.consulta_ia.ai.context.token_budget import (
    estimate_message_tokens,
    estimate_tokens,
)
from apps.consulta_ia.ai.contracts import AIMessage


@dataclass(frozen=True)
class BuiltContext:
    messages: tuple[AIMessage, ...]
    dropped_messages: int
    estimated_tokens: int


class ContextBuilder:
    def __init__(self, *, max_input_tokens: int, max_messages: int):
        if max_input_tokens <= 0 or max_messages <= 0:
            raise ValueError("Os limites de contexto devem ser positivos.")
        self._max_input_tokens = max_input_tokens
        self._max_messages = max_messages

    @property
    def max_messages(self) -> int:
        return self._max_messages

    def build(self, history: Sequence[AIMessage], instructions: str) -> BuiltContext:
        instructions_cost = estimate_tokens(instructions)
        budget = self._max_input_tokens - instructions_cost

        selected: list[AIMessage] = []
        used = 0
        for message in reversed(history):
            cost = estimate_message_tokens(message)
            if selected and (
                len(selected) >= self._max_messages or used + cost > budget
            ):
                break
            selected.append(message)
            used += cost

        selected.reverse()
        return BuiltContext(
            messages=tuple(selected),
            dropped_messages=len(history) - len(selected),
            estimated_tokens=instructions_cost + used,
        )