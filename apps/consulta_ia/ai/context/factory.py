from django.conf import settings

from apps.consulta_ia.ai.context.builder import ContextBuilder


def get_context_builder() -> ContextBuilder:
    return ContextBuilder(
        max_input_tokens=settings.AI_CONTEXT_MAX_INPUT_TOKENS,
        max_messages=settings.AI_CONTEXT_MAX_MESSAGES,
    )