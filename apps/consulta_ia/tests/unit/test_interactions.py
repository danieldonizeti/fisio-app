from datetime import timedelta

import pytest
from django.utils import timezone

from apps.consulta_ia.application.interactions import InteractionTracker
from apps.consulta_ia.domain.exceptions import (
    InteractionInProgressError,
    SimulationClosedError,
)
from apps.consulta_ia.models import InteracaoIA, SimulacaoConsulta

MSG = InteracaoIA.Tipo.MENSAGEM


@pytest.fixture
def tracker():
    return InteractionTracker(lease_seconds=60)


@pytest.mark.django_db
def test_segunda_reserva_na_mesma_simulacao_e_rejeitada(tracker, simulacao):
    tracker.begin(simulacao, MSG)
    with pytest.raises(InteractionInProgressError):
        tracker.begin(simulacao, MSG)
    assert InteracaoIA.objects.count() == 1


@pytest.mark.django_db
def test_simulacoes_diferentes_nao_se_bloqueiam(tracker, simulacao, usuario):
    outra = SimulacaoConsulta.objects.create(fisioterapeuta=usuario, titulo="outra")
    tracker.begin(simulacao, MSG)
    tracker.begin(outra, MSG)


@pytest.mark.django_db
@pytest.mark.parametrize("finalizar", ["complete", "fail"])
def test_reserva_e_liberada_ao_concluir_ou_falhar(tracker, simulacao, finalizar):
    interacao = tracker.begin(simulacao, MSG)
    if finalizar == "complete":
        tracker.complete(interacao)
    else:
        tracker.fail(interacao, RuntimeError("x"))
    tracker.begin(simulacao, MSG)


@pytest.mark.django_db
def test_reserva_expirada_deixa_de_bloquear(tracker, simulacao):
    antiga = InteracaoIA.objects.create(
        simulacao=simulacao, tipo=MSG, iniciada_em=timezone.now() - timedelta(seconds=120)
    )
    tracker.begin(simulacao, MSG)
    antiga.refresh_from_db()
    assert antiga.estado == "falhou"
    assert antiga.erro_codigo == "lease_expired"


@pytest.mark.django_db
def test_nao_reserva_simulacao_finalizada_mesmo_com_objeto_desatualizado(tracker, simulacao):
    SimulacaoConsulta.objects.filter(pk=simulacao.pk).update(ativa=False)
    assert simulacao.ativa is True 
    with pytest.raises(SimulationClosedError):
        tracker.begin(simulacao, MSG)
    assert InteracaoIA.objects.count() == 0


@pytest.mark.django_db
def test_concluir_com_reserva_perdida_levanta_erro(tracker, simulacao):
    interacao = tracker.begin(simulacao, MSG)
    InteracaoIA.objects.filter(pk=interacao.pk).update(estado="falhou")
    with pytest.raises(InteractionInProgressError):
        tracker.complete(interacao)