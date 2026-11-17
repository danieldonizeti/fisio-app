import pytest
from django.conf import settings

from apps.consulta_ia.ai.contracts import AIMessage, AIRequest
from apps.consulta_ia.ai.providers.factory import get_ai_provider

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        not (settings.OPENAI_API_KEY and settings.OPENAI_MODEL),
        reason="OPENAI_API_KEY / OPENAI_MODEL não configurados",
    ),
]


def test_chamada_real_retorna_texto():
    req = AIRequest(
        instructions="Responda em uma frase curta, em português.",
        messages=(AIMessage("user", "Diga olá."),),
        max_output_tokens=300,
    )
    out = get_ai_provider().generate(req)
    assert out.content