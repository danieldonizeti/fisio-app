import math
from datetime import datetime

from django.db.models import Count, Sum

from apps.consulta_ia.models import InteracaoIA

Estado = InteracaoIA.Estado


def percentil(valores: list[float], p: float) -> float | None:
    """Percentil pelo método do posto mais próximo."""
    if not valores:
        return None
    ordenados = sorted(valores)
    posicao = max(0, math.ceil(p / 100 * len(ordenados)) - 1)
    return ordenados[posicao]


def calcular_metricas(desde: datetime) -> dict:
    base = InteracaoIA.objects.filter(iniciada_em__gte=desde)
    resultado = {}
    for tipo in InteracaoIA.Tipo.values:
        do_tipo = base.filter(tipo=tipo)
        total = do_tipo.count()
        falhas = do_tipo.filter(estado=Estado.FALHOU)
        concluidas = do_tipo.filter(estado=Estado.CONCLUIDA)

        duracoes = [
            (i.finalizada_em - i.iniciada_em).total_seconds()
            for i in concluidas.only("iniciada_em", "finalizada_em")
        ]
        tokens = concluidas.aggregate(entrada=Sum("tokens_entrada"), saida=Sum("tokens_saida"))
        n_falhas = falhas.count()

        resultado[tipo] = {
            "total": total,
            "falhas": n_falhas,
            "taxa_falha": (n_falhas / total) if total else 0.0,
            "p50_s": percentil(duracoes, 50),
            "p95_s": percentil(duracoes, 95),
            "tokens_entrada": tokens["entrada"] or 0,
            "tokens_saida": tokens["saida"] or 0,
            "erros": dict(
                falhas.values_list("erro_codigo")
                .annotate(n=Count("id"))
                .order_by("-n")
            ),
        }
    return resultado