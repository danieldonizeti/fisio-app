# apps/consulta_ia/tests/conftest.py
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from django.core.cache import cache
from django.contrib.auth import get_user_model

from apps.patologias.models import Patologia
from apps.consulta_ia.ai.contracts import AIResponse
from apps.consulta_ia.models import SimulacaoConsulta
from apps.consulta_ia.ai.contracts import AIResponse, AIStructuredResponse
from apps.consulta_ia.ai.schemas import DiagnosisEvaluation

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


class IAFalsa:
    def __init__(self):
        self.resposta = "Dói quando levanto o braço, doutor."
        self.avaliacao = DiagnosisEvaluation(
            veredito="proximo",
            analise_clinica="Voce identificou a região, mas faltou precisão.",
            dica_do_professor="Avalie o arco doloroso e os testes especificos"
        )
        self.erro = None
        self.requisicoes = []

    def generate(self, request):
        self.requisicoes.append(request)
        if self.erro:
            raise self.erro
        return AIResponse(content=self.resposta, model="falso")


    def generate_structured(self, request, schema):
        self.requisicoes.append(request)
        if self.erro:
            raise self.erro
        return AIStructuredResponse(parsed=self.avaliacao, model="falso")


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


@pytest.fixture
def patologia(db):
    return Patologia.objects.create(nome="Tendinite do supraespinhal", regiao="ombro", descricao="Dor forte e pontuda")


@pytest.fixture(autouse=True)
def limpar_cache():
    cache.clear()
    yield
    cache.clear()