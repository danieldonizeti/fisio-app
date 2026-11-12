import pytest

from apps.consulta_ia.application.use_cases.start_simulation import StartSimulation
from apps.consulta_ia.domain.exceptions import NoPathologyAvailableError
from apps.patologias.models import Patologia


@pytest.mark.django_db
def test_usa_a_patologia_escolhida_pelo_sorteio(usuario):
    Patologia.objects.create(nome="Capsulite adesiva", regiao="ombro", descricao="Descrição")
    alvo = Patologia.objects.create(nome="Tendinite do supraespinhal", regiao="ombro", descricao="descrição")

    simulacao = StartSimulation(choose=lambda itens: next(p for p in itens if p.pk == alvo.pk)).execute(
        usuario, "Caso", "facil"
    )

    assert simulacao.patologia_simulada == "Tendinite do supraespinhal"
    assert simulacao.ativa is True


@pytest.mark.django_db
def test_sem_patologias_levanta_erro(usuario):
    with pytest.raises(NoPathologyAvailableError):
        StartSimulation().execute(usuario, "Caso", "facil")