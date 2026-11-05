from django.conf import settings

from apps.consulta_ia.ai.providers.openai_provider import OpenAIProvider


def get_ai_provider() -> OpenAIProvider:

    return OpenAIProvider(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_MODEL,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        send_temperature=False
    )