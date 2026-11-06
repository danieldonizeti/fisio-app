import pytest

from apps.consulta_ia.ai.context.builder import ContextBuilder
from apps.consulta_ia.ai.context.token_budget import estimate_tokens
from apps.consulta_ia.ai.contracts import AIMessage


def msg(i, n=30):
    role = "user" if i % 2 == 0 else "assistant"
    return AIMessage(role, f"{i}".ljust(n, "x"))


def test_estimate_tokens():
    assert estimate_tokens("") == 0
    assert estimate_tokens("abc") == 1
    assert estimate_tokens("abcd") == 2


def test_historico_dentro_do_orcamento_passa_inteiro():
    historico = [msg(0), msg(1), msg(2)]  # 3 x 14 = 42 tokens
    ctx = ContextBuilder(max_input_tokens=100, max_messages=10).build(historico, "")
    assert ctx.messages == tuple(historico)
    assert ctx.dropped_messages == 0


def test_descarta_as_mais_antigas_ao_estourar_o_orcamento():
    historico = [msg(0), msg(1), msg(2)]
    ctx = ContextBuilder(max_input_tokens=30, max_messages=10).build(historico, "")
    assert ctx.messages == (historico[1], historico[2])  # ordem preservada
    assert ctx.dropped_messages == 1


def test_ultima_mensagem_sempre_entra_mesmo_acima_do_orcamento():
    historico = [msg(0), msg(1, n=300)]  # a última custa 104 tokens
    ctx = ContextBuilder(max_input_tokens=20, max_messages=10).build(historico, "")
    assert ctx.messages == (historico[1],)
    assert ctx.dropped_messages == 1


def test_respeita_o_limite_de_quantidade():
    historico = [msg(i) for i in range(5)]
    ctx = ContextBuilder(max_input_tokens=10_000, max_messages=2).build(historico, "")
    assert ctx.messages == (historico[3], historico[4])


def test_instrucoes_consomem_orcamento():
    historico = [msg(0), msg(1), msg(2)]
    instrucoes_grandes = "x" * 300  # 100 tokens
    ctx = ContextBuilder(max_input_tokens=100, max_messages=10).build(
        historico, instrucoes_grandes
    )
    assert ctx.messages == (historico[2],)


def test_limites_invalidos_sao_rejeitados():
    with pytest.raises(ValueError):
        ContextBuilder(max_input_tokens=0, max_messages=5)