from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.consulta_ia.domain.exceptions import (
    ConsultaIAError,
    InteractionInProgressError,
    SimulationClosedError,
)
from apps.consulta_ia.models import InteracaoIA, SimulacaoConsulta

Estado = InteracaoIA.Estado


class InteractionTracker:
    def __init__(self, lease_seconds: int | None = None):
        self._lease = (
            lease_seconds
            if lease_seconds is not None
            else settings.AI_INTERACTION_LEASE_SECONDS
        )

    def begin(self, simulacao, tipo) -> InteracaoIA:
        """Adquire a reserva da simulação (transação curta)."""
        limite = timezone.now() - timedelta(seconds=self._lease)
        try:
            with transaction.atomic():
                
                InteracaoIA.objects.filter(
                    simulacao=simulacao, estado=Estado.PROCESSANDO, iniciada_em__lt=limite
                ).update(
                    estado=Estado.FALHOU,
                    erro_codigo="lease_expired",
                    finalizada_em=timezone.now(),
                )

                if not SimulacaoConsulta.objects.filter(pk=simulacao.pk, ativa=True).exists():
                    raise SimulationClosedError()
                return InteracaoIA.objects.create(simulacao=simulacao, tipo=tipo)
        except IntegrityError as exc:
            raise InteractionInProgressError() from exc

    def complete(self, interacao, *, modelo="", tokens_entrada=None, tokens_saida=None):
        atualizadas = InteracaoIA.objects.filter(
            pk=interacao.pk, estado=Estado.PROCESSANDO
        ).update(
            estado=Estado.CONCLUIDA,
            modelo=modelo,
            tokens_entrada=tokens_entrada,
            tokens_saida=tokens_saida,
            finalizada_em=timezone.now(),
        )
        if not atualizadas:
            raise InteractionInProgressError("Reserva expirou antes da conclusão.")

    def fail(self, interacao, exc: Exception) -> None:
        codigo = exc.code if isinstance(exc, ConsultaIAError) else "unexpected_error"
        InteracaoIA.objects.filter(pk=interacao.pk, estado=Estado.PROCESSANDO).update(
            estado=Estado.FALHOU, erro_codigo=codigo, finalizada_em=timezone.now()
        )