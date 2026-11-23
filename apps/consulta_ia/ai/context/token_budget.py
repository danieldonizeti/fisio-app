import math

from apps.consulta_ia.ai.contracts import AIMessage

_CHARS_PER_TOKEN = 3
_OVERHEAD_PER_MESSAGE = 4


def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return math.ceil(len(text) / _CHARS_PER_TOKEN)


def estimate_message_tokens(message: AIMessage) -> int:
    return estimate_tokens(message.content) + _OVERHEAD_PER_MESSAGE