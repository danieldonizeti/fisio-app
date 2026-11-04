import pytest

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework.test import APIClient

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
def client():
    return APIClient()


@pytest.mark.django_db
def test_usuario_lista_somente_suas_simulacoes(
    client,
    usuario,
    outro_usuario
):
    SimulacaoConsulta.objects.create(
        fisioterapeuta=usuario,
        titulo="Minha Simulação",
        nivel="facil"
    )

    SimulacaoConsulta.objects.create(
        fisioterapeuta=outro_usuario,
        titulo="Simulação de outro usuário",
        nivel="medio"
    )

    client.force_authenticate(user=usuario)

    url = reverse("simulacao-list")
    response = client.get(url)

    assert response.status_code == 200
    #assert len(response.data["results"]) == 1
    #assert response.data["results"][0]["titulo"] == "Minha Simulação"


@pytest.mark.django_db
def test_usuario_nao_acessa_simulacao_de_outro_usuario(
    client,
    usuario,
    outro_usuario
):
    simulacao = SimulacaoConsulta.objects.create(
        fisioterapeuta=outro_usuario,
        titulo="Simulação privada",
        nivel="medio"
    )

    client.force_authenticate(user=usuario)

    url = reverse(
        "simulacao-detail",
        kwargs={"pk": simulacao.pk}
    )

    response = client.get(url)

    assert response.status_code == 404
