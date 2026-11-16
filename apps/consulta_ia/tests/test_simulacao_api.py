import pytest

from django.urls import reverse

from rest_framework.throttling import ScopedRateThrottle

from apps.patologias.models import Patologia
from apps.consulta_ia.models import SimulacaoConsulta, MensagemSimulacao, InteracaoIA
from apps.consulta_ia.domain.exceptions import AIProviderError


def url_acao(nome, pk):
    return reverse(f"simulacao-{nome}", kwargs={"pk": pk})


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
    #assert response.data["results"]["titulo"] == "Minha Simulação"


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
    assert MensagemSimulacao.objects.count() == 0


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


# 5. Proteção da patologia
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


@pytest.mark.django_db
def test_detalhe_nao_expoe_patologia(api_client, usuario, simulacao):
    api_client.force_authenticate(user=usuario)
    response = api_client.get(reverse("simulacao-detail", kwargs={"pk": simulacao.pk}))
    assert "patologia_simulada" not in response.data


# 6. Falha da IA
@pytest.mark.django_db
def test_falha_da_ia_retorna_500(api_client, usuario, simulacao, ia_falsa):
    ia_falsa.erro = AIProviderError("segredo-do-sdk")
    api_client.force_authenticate(user=usuario)
    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "oi"})
    assert response.status_code == 500


@pytest.mark.django_db
def test_falha_da_ia_nao_vaza_detalhes(api_client, usuario, simulacao, ia_falsa):
    ia_falsa.erro = AIProviderError("segredo-do-sdk")
    api_client.force_authenticate(user=usuario)
    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "oi"})
    assert response.status_code == 500
    assert response.data["code"] == "ai_provider_error"
    assert "segredo-do-sdk" not in str(response.data)


@pytest.mark.django_db
def test_enviar_mensagem_retorna_resposta_do_paciente(api_client, usuario, simulacao):
    api_client.force_authenticate(user=usuario)
    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "Onde dói?"})
    assert response.status_code == 200
    assert response.data == {
        "remetente": "paciente",
        "conteudo": "Dói quando levanto o braço, doutor.",
    }
    assert [m.remetente for m in simulacao.mensagens.all()] == ["fisio", "paciente"]


@pytest.mark.django_db
@pytest.mark.parametrize("valor", [None, 123, ["a"]])
def test_mensagem_nao_textual_retorna_400(api_client, usuario, simulacao, valor):
    api_client.force_authenticate(user=usuario)
    response = api_client.post(
        url_acao("enviar-mensagem", simulacao.pk), {"mensagem": valor}, format="json"
    )
    assert response.status_code == 400
    assert response.data["code"] == "invalid_message"


@pytest.mark.django_db
def test_submeter_diagnostico_retorna_avaliacao(api_client, usuario, simulacao):
    api_client.force_authenticate(user=usuario)
    response = api_client.post(
        url_acao("submeter-diagnostico", simulacao.pk), {"diagnostico": "tendinite"}, format="json"
    )
    assert response.status_code == 200
    assert response.data["veredito"] == "proximo"
    assert response.data["patologia_real"] == "Tendinite do supraespinhal"
    assert "Análise Clínica" in response.data["feedback"]
    simulacao.refresh_from_db()
    assert simulacao.ativa is False


@pytest.mark.django_db
def test_falha_na_avaliacao_nao_da_falso_sucesso(api_client, usuario, simulacao, ia_falsa):
    ia_falsa.erro = AIProviderError("segredo-do-sdk")
    api_client.force_authenticate(user=usuario)
    response = api_client.post(
        url_acao("submeter-diagnostico", simulacao.pk), {"diagnostico": "tendinite"}, format="json"
    )
    assert response.status_code == 500
    assert "segredo-do-sdk" not in str(response.data)
    assert "patologia_real" not in response.data
    simulacao.refresh_from_db()
    assert simulacao.ativa is True


@pytest.mark.django_db
def test_diagnostico_vazio_retorna_400(api_client, usuario, simulacao):
    api_client.force_authenticate(user=usuario)
    response = api_client.post(
        url_acao("submeter-diagnostico", simulacao.pk), {"diagnostico": "  "}, format="json"
    )
    assert response.status_code == 400
    assert response.data["code"] == "invalid_diagnosis"


@pytest.mark.django_db
def test_nao_submete_diagnostico_na_simulacao_de_outro_usuario(api_client, simulacao, outro_usuario):
    api_client.force_authenticate(user=outro_usuario)
    response = api_client.post(
        url_acao("submeter-diagnostico", simulacao.pk), {"diagnostico": "x"}, format="json"
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_mensagem_no_limite_passa_e_acima_do_limite_e_rejeitada(
    api_client, usuario, simulacao, settings
):
    settings.AI_MAX_USER_MESSAGE_CHARS = 50
    api_client.force_authenticate(user=usuario)
    url = url_acao("enviar-mensagem", simulacao.pk)

    assert api_client.post(url, {"mensagem": "a" * 50}).status_code == 200

    response = api_client.post(url, {"mensagem": "a" * 51})
    assert response.status_code == 400
    assert response.data["code"] == "input_too_long"


@pytest.mark.django_db
def test_diagnostico_muito_longo_retorna_400(api_client, usuario, simulacao, settings, ia_falsa):
    settings.AI_MAX_DIAGNOSIS_CHARS = 20
    api_client.force_authenticate(user=usuario)
    response = api_client.post(
        url_acao("submeter-diagnostico", simulacao.pk), {"diagnostico": "x" * 21}, format="json"
    )
    assert response.status_code == 400
    assert response.data["code"] == "input_too_long"
    assert ia_falsa.requisicoes == []


@pytest.mark.django_db
def test_diagnostico_so_pode_ser_submetido_uma_vez(api_client, usuario, simulacao, ia_falsa):
    api_client.force_authenticate(user=usuario)
    url = url_acao("submeter-diagnostico", simulacao.pk)

    assert api_client.post(url, {"diagnostico": "tendinite"}, format="json").status_code == 200

    segunda = api_client.post(url, {"diagnostico": "tendinite"}, format="json")
    assert segunda.status_code == 400
    assert segunda.data["code"] == "simulation_closed"
    assert len(ia_falsa.requisicoes) == 1  # a segunda não chamou (nem cobrou) a IA


@pytest.mark.django_db
def test_patch_nao_reabre_simulacao_finalizada(api_client, usuario, simulacao):
    simulacao.ativa = False
    simulacao.save()
    api_client.force_authenticate(user=usuario)
    api_client.patch(
        reverse("simulacao-detail", kwargs={"pk": simulacao.pk}), {"ativa": True}, format="json"
    )
    simulacao.refresh_from_db()
    assert simulacao.ativa is False


@pytest.mark.django_db
def test_criar_simulacao_ignora_campo_ativa_enviada_pelo_cliente(api_client, usuario):

    Patologia.objects.create(nome="sindrome do manguito rotador")

    api_client.force_authenticate(user=usuario)
    response = api_client.post(
        reverse("simulacao-list"), {"titulo": "x", "nivel": "facil", "patologia": "sindrome do manguito rotador", "descricao": "descricao", "ativa": False}, format="json"
    )
    assert response.status_code == 201
    assert response.data["ativa"] is True


@pytest.mark.django_db
def test_enviar_mensagem_tem_limite_de_requisicoes(api_client, usuario, simulacao, monkeypatch):
    monkeypatch.setattr(
        ScopedRateThrottle, "THROTTLE_RATES", {"ia_mensagem": "2/min", "ia_diagnostico": "5/min"}
    )
    api_client.force_authenticate(user=usuario)
    url = url_acao("enviar-mensagem", simulacao.pk)

    codigos = [api_client.post(url, {"mensagem": "oi"}).status_code for _ in range(3)]

    assert codigos == [200, 200, 429]


@pytest.mark.django_db
def test_criar_sorteia_a_patologia_no_servidor_e_ignora_a_do_cliente(
    api_client, usuario, patologia
):
    api_client.force_authenticate(user=usuario)
    response = api_client.post(
        reverse("simulacao-list"),
        {"titulo": "x", "nivel": "facil", "patologia_simulada": "Inventada pelo cliente"},
        format="json",
    )
    assert response.status_code == 201
    assert "patologia_simulada" not in response.data
    criada = SimulacaoConsulta.objects.get(pk=response.data["id"])
    assert criada.patologia_simulada == "Tendinite do supraespinhal"
    assert criada.fisioterapeuta == usuario


@pytest.mark.django_db
def test_criar_sem_patologias_cadastradas_retorna_503(api_client, usuario):
    api_client.force_authenticate(user=usuario)
    response = api_client.post(
        reverse("simulacao-list"), {"titulo": "x", "nivel": "facil"}, format="json"
    )
    assert response.status_code == 503
    assert response.data["code"] == "no_pathology_available"
    assert SimulacaoConsulta.objects.count() == 0


@pytest.mark.django_db
def test_listagem_nao_expoe_a_patologia(api_client, usuario, simulacao):
    api_client.force_authenticate(user=usuario)
    response = api_client.get(reverse("simulacao-list"))
    assert "patologia_simulada" not in str(response.data)
    assert "Tendinite" not in str(response.data)


@pytest.mark.django_db
def test_endpoint_patologia_aleatoria_nao_existe_mais(api_client, usuario):
    api_client.force_authenticate(user=usuario)
    assert api_client.get("/api/consulta-ia/patologia-aleatoria/").status_code == 404


@pytest.mark.django_db
def test_requisicao_simultanea_retorna_409(api_client, usuario, simulacao, ia_falsa):
    InteracaoIA.objects.create(simulacao=simulacao, tipo="mensagem")
    api_client.force_authenticate(user=usuario)

    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "oi"})

    assert response.status_code == 409
    assert response.data["code"] == "interaction_in_progress"
    assert ia_falsa.requisicoes == []


@pytest.mark.django_db
def test_falha_da_ia_nao_deixa_mensagem_sem_resposta(api_client, usuario, simulacao, ia_falsa):
    ia_falsa.erro = AIProviderError("boom")
    api_client.force_authenticate(user=usuario)

    response = api_client.post(url_acao("enviar-mensagem", simulacao.pk), {"mensagem": "oi"})

    assert response.status_code == 500
    assert simulacao.mensagens.count() == 0