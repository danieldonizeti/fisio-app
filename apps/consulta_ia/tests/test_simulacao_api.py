import pytest

from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework.test import APIClient

from apps.consulta_ia.models import SimulacaoConsulta


User = get_user_model()

def url_acao(nome, pk):
    return reverse(f"simulacao-{nome}", kwargs={"pk": pk})


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
def llm_falso(monkeypatch):
    """Toda chamada ao LLM nos testes é simulada"""
    monkeypatch.setenv("API_KEY", "chave_falsa_de_teste")
    with patch("apps.consulta_ia.views.views.genai.Client") as client_cls:
        gerar = client_cls.return_value.models.generate_content
        gerar.return_value = SimpleNamespace(text="Dói quando levanto o braço, doutor")
        yield gerar


@pytest.fixture
def simulacao(usuario):
    return SimulacaoConsulta.objects.create(
        fisioterapeuta=usuario,
        titulo="Caso de teste",
        nivel="facil",
        patologia_simulada="Tendinite do supraespinhal",
    )


@pytest.mark.django_db
def test_listar_simulacoes_sem_autenticacao_retorna_401(api_client):
    response = api_client.get(reverse("simulacao-list"))
    assert response.status_code == 401


@pytest.mark.django_db
def test_enviar_mensagem_sem_autenticacao_retorna_401(api_client, simulacao):
    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "oi"})
    assert response.status_code == 401


@pytest.mark.django_db
def test_usuario_lista_somente_suas_simulacoes(
    api_client,
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

    api_client.force_authenticate(user=usuario)

    url = reverse("simulacao-list")
    response = api_client.get(url)

    assert response.status_code == 200
    assert len(response.data) == 1
    #assert response.data["results"][0]["titulo"] == "Minha Simulação"


@pytest.mark.django_db
def test_usuario_nao_acessa_simulacao_de_outro_usuario(
    api_client,
    usuario,
    outro_usuario
):
    simulacao = SimulacaoConsulta.objects.create(
        fisioterapeuta=outro_usuario,
        titulo="Simulação privada",
        nivel="medio"
    )

    api_client.force_authenticate(user=usuario)

    url = reverse(
        "simulacao-detail",
        kwargs={"pk": simulacao.pk}
    )

    response = api_client.get(url)

    assert response.status_code == 404


@pytest.mark.django_db
def test_nao_envia_mensagem_na_simulacao_de_outro_usuario(api_client, simulacao, outro_usuario):
    api_client.force_authenticate(user=outro_usuario)

    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "oi"})

    assert response.status_code == 404
    #assert MensagemSimulacao.objects.count() == 0


#PAYLOAD
@pytest.mark.django_db
@pytest.mark.parametrize("texto", ["", "   "])
def test_mensagem_vazia_retorna_400(api_client, usuario, simulacao, texto):
    api_client.force_authenticate(user=usuario)
    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": texto})

    assert response.status_code == 400


# 4. Estado da simulação
@pytest.mark.django_db
def test_simulacao_finalizada_rejeita_mensagem(api_client, usuario, simulacao):
    simulacao.ativa = False
    simulacao.save()
    api_client.force_authenticate(user=usuario)
    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "oi"})
    assert response.status_code == 400


@pytest.mark.xfail(strict=True, reason="Sem limite agora")
@pytest.mark.django_db
def test_mensagem_muito_longa_retorna_400(api_client, usuario, simulacao):
    api_client.force_authenticate(user=usuario)
    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "a" * 5000})
    assert response.status_code == 400


# 5. Proteção da patologia
@pytest.mark.xfail(strict=True, reason="patologia_simulada é gravável; irei corrigir depois")
@pytest.mark.django_db
def test_patch_nao_altera_patologia(api_client, usuario, simulacao):
    api_client.force_authenticate(user=usuario)
    api_client.patch(
        reverse("simulacao-detail", kwargs={"pk": simulacao.pk}),
        {"patologia_simulada": "Inventada pelo cliente"},
        format="json",
    )
    simulacao.refresh_from_db()
    assert simulacao.patologia_simulada == "Tendinite do supraespinhal"


@pytest.mark.xfail(strict=True, reason="A API devolve a patologia secreta; corrigir no PR 7")
@pytest.mark.django_db
def test_detalhe_nao_expoe_patologia(api_client, usuario, simulacao):
    api_client.force_authenticate(user=usuario)
    response = api_client.get(reverse("simulacao-detail", kwargs={"pk": simulacao.pk}))
    assert "patologia_simulada" not in response.data


# 6. Falha da IA
@pytest.mark.django_db
def test_falha_da_ia_retorna_500(api_client, usuario, simulacao, llm_falso):
    llm_falso.side_effect = Exception("segredo-do-sdk")
    api_client.force_authenticate(user=usuario)
    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "oi"})
    assert response.status_code == 500


@pytest.mark.xfail(strict=True, reason="str(e) vaza para o cliente")
@pytest.mark.django_db
def test_falha_da_ia_nao_vaza_detalhes(api_client, usuario, simulacao, gemini_falso):
    gemini_falso.side_effect = Exception("segredo-do-sdk")
    api_client.force_authenticate(user=usuario)
    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "oi"})
    assert "segredo-do-sdk" not in str(response.data)