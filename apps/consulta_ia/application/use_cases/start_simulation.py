import random
from collections.abc import Callable, Sequence

from apps.consulta_ia.domain.exceptions import NoPathologyAvailableError
from apps.consulta_ia.models import SimulacaoConsulta
from apps.patologias.models import Patologia


class StartSimulation:
    def __init__(self, choose: Callable[[Sequence], object] = random.choice):
        self._choose = choose


    def execute(self, fisioterapeuta, titulo: str, nivel: str) -> SimulacaoConsulta:
        patologias = list(Patologia.objects.all())

        if not patologias:
            raise NoPathologyAvailableError()

        patologia = self._choose(patologias)
        return SimulacaoConsulta.objects.create(
            fisioterapeuta=fisioterapeuta,
            titulo=titulo,
            nivel=nivel,
            patologia_simulada=patologia.nome,
        )