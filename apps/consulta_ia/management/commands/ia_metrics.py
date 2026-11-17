from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.consulta_ia.application.metrics import calcular_metricas


def _fmt(valor):
    return "-" if valor is None else f"{valor:.1f}s"


class Command(BaseCommand):
    help = "Resumo das interações com a IA (taxa de falha, latência, tokens)."

    def add_arguments(self, parser):
        parser.add_argument("--dias", type=int, default=7)

    def handle(self, *args, **opcoes):
        desde = timezone.now() - timedelta(days=opcoes["dias"])
        self.stdout.write(f"Interações com a IA nos últimos {opcoes['dias']} dias\n")
        for tipo, m in calcular_metricas(desde).items():
            self.stdout.write(
                f"[{tipo}] total={m['total']} falhas={m['falhas']} "
                f"({m['taxa_falha']:.1%}) p50={_fmt(m['p50_s'])} p95={_fmt(m['p95_s'])} "
                f"tokens_entrada={m['tokens_entrada']} tokens_saida={m['tokens_saida']}"
            )
            for codigo, n in m["erros"].items():
                self.stdout.write(f"    erro {codigo}: {n}")