import json
import logging
from datetime import timedelta

import pytest
from django.utils import timezone

from apps.consulta_ia.application.interactions import InteractionTracker
from apps.consulta_ia.domain.exceptions import AIProviderError
from apps.consulta_ia.models import InteracaoIA
from apps.consulta_ia.observability import JsonFormatter

LOGGER_TRACKER = "apps.consulta_ia.application.interactions"


def test_formatador_gera_json_com_os_campos_extras():
    log = logging.getLogger("teste")
    registro = log.makeRecord(
        "teste", logging.INFO, "arquivo.py", 1, "ia_evento", (), None,
        extra={"tipo": "mensagem", "duracao_ms": 120},
    )
    dados = json.loads(JsonFormatter().format(registro))
    assert dados["msg"] == "ia_evento"
    assert dados["level"] == "INFO"
    assert dados["tipo"] == "mensagem"
    assert dados["duracao_ms"] == 120


@pytest.mark.django_db
def test_conclusao_registra_modelo_tokens_e_duracao(simulacao, caplog):
    tracker = InteractionTracker(lease_seconds=60)
    interacao = tracker.begin(simulacao, InteracaoIA.Tipo.MENSAGEM)

    with caplog.at_level(logging.INFO, logger=LOGGER_TRACKER):
        tracker.complete(interacao, modelo="modelo-x", tokens_entrada=10, tokens_saida=5)

    registro = next(r for r in caplog.records if r.getMessage() == "ia_interacao_concluida")
    assert registro.tipo == "mensagem"
    assert registro.modelo == "modelo-x"
    assert (registro.tokens_entrada, registro.tokens_saida) == (10, 5)
    assert registro.duracao_ms >= 0
    assert registro.simulacao_id == simulacao.pk


@pytest.mark.django_db
def test_falha_registra_warning_com_o_codigo_do_erro(simulacao, caplog):
    tracker = InteractionTracker(lease_seconds=60)
    interacao = tracker.begin(simulacao, InteracaoIA.Tipo.MENSAGEM)

    with caplog.at_level(logging.INFO, logger=LOGGER_TRACKER):
        tracker.fail(interacao, AIProviderError("detalhe interno"))

    registro = next(r for r in caplog.records if r.getMessage() == "ia_interacao_falhou")
    assert registro.levelno == logging.WARNING
    assert registro.erro_codigo == "ai_provider_error"
    assert registro.erro_tipo == "AIProviderError"
    assert "detalhe interno" not in JsonFormatter().format(registro)