from datetime import timedelta
from io import StringIO

import pytest
from django.core.management import call_command
from django.utils import timezone

from apps.consulta_ia.application.metrics import calcular_metricas, percentil
from apps.consulta_ia.models import InteracaoIA


def criar(simulacao, estado, segundos=None, dias_atras=0, **campos):
    inicio = timezone.now() - timedelta(days=dias_atras, minutes=5)
    fim = inicio + timedelta(seconds=segundos) if segundos is not None else None
    return InteracaoIA.objects.create(
        simulacao=simulacao, tipo="mensagem", estado=estado,
        iniciada_em=inicio, finalizada_em=fim, **campos,
    )


def test_percentil_posto_mais_proximo():
    assert percentil([4, 1, 3, 2], 50) == 2
    assert percentil([4, 1, 3, 2], 95) == 4
    assert percentil([], 50) is None


@pytest.mark.django_db
def test_calcula_taxa_de_falha_latencia_tokens_e_erros(simulacao):
    for s in (1, 2, 3, 4):
        criar(simulacao, "concluida", s, tokens_entrada=100, tokens_saida=20)
    criar(simulacao, "falhou", 2, erro_codigo="ai_provider_error")
    criar(simulacao, "concluida", 1, dias_atras=30, tokens_entrada=999)  # fora da janela

    m = calcular_metricas(timezone.now() - timedelta(days=7))["mensagem"]

    assert m["total"] == 5
    assert m["falhas"] == 1
    assert m["taxa_falha"] == pytest.approx(0.2)
    assert (m["p50_s"], m["p95_s"]) == (2.0, 4.0)
    assert (m["tokens_entrada"], m["tokens_saida"]) == (400, 80)
    assert m["erros"] == {"ai_provider_error": 1}


@pytest.mark.django_db
def test_periodo_sem_dados_nao_quebra():
    m = calcular_metricas(timezone.now() - timedelta(days=7))
    assert m["diagnostico"]["taxa_falha"] == 0.0
    assert m["diagnostico"]["p95_s"] is None


@pytest.mark.django_db
def test_comando_imprime_o_resumo(simulacao):
    criar(simulacao, "concluida", 2, tokens_entrada=10, tokens_saida=5)
    saida = StringIO()
    call_command("ia_metrics", "--dias", "7", stdout=saida)
    texto = saida.getvalue()
    assert "[mensagem] total=1" in texto
    assert "[diagnostico] total=0" in texto