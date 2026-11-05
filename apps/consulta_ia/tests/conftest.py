# apps/consulta_ia/tests/conftest.py
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model

from apps.consulta_ia.ai.contracts import AIResponse
from apps.consulta_ia.models import SimulacaoConsulta

User = get_user_model()


@pytest.fixture
def usuario():
    return User.objects.create_user(
        email="ana@example.com",
        password="senha-teste"
    )


@pytest.fixture
def outro_usuario():
    return User.objects.create_user(
        email="carlos@example.com",
        password="senha-teste-123"
    )

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def gemini_falso(monkeypatch):
    """Ainda necessário: submeter_diagnostico usa o Gemini até o PR 6."""
    monkeypatch.setenv("GEMINI_API_KEY", "chave-falsa-de-teste")
    with patch("apps.consulta_ia.views.views.genai.Client") as client_cls:
        gerar = client_cls.return_value.models.generate_content
        gerar.return_value = SimpleNamespace(text="Feedback falso.")
        yield gerar


class IAFalsa:
    def __init__(self):
        self.resposta = "Dói quando levanto o braço, doutor."
        self.erro = None
        self.requisicoes = []

    def generate(self, request):
        self.requisicoes.append(request)
        if self.erro:
            raise self.erro
        return AIResponse(content=self.resposta, model="falso")


@pytest.fixture(autouse=True)
def ia_falsa():
    falsa = IAFalsa()
    with patch("apps.consulta_ia.views.views.get_ai_provider", return_value=falsa):
        yield falsa


@pytest.fixture
def simulacao(usuario):
    return SimulacaoConsulta.objects.create(
        fisioterapeuta=usuario,
        titulo="Caso de teste",
        nivel="facil",
        patologia_simulada="Tendinite do supraespinhal",
    )
