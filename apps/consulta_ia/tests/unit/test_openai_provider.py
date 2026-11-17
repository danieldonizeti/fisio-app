from types import SimpleNamespace
from pydantic import ValidationError

import pytest
from openai import OpenAIError

from apps.consulta_ia.ai.contracts import AIMessage, AIProvider, AIRequest
from apps.consulta_ia.ai.providers.openai_provider import OpenAIProvider
from apps.consulta_ia.domain.exceptions import (
    AIEmptyResponseError,
    AIProviderError,
    AIUnavailableError,
)
from apps.consulta_ia.ai.contracts import StructuredAIProvider
from apps.consulta_ia.ai.schemas import DiagnosisEvaluation
from apps.consulta_ia.domain.exceptions import AIInvalidOutputError

AVALIACAO = DiagnosisEvaluation(
    veredito="correto", analise_clinica="Boa análise.", dica_do_professor="Teste o arco doloroso."
)


class ClienteFalso:
    def __init__(self, resposta=None, erro=None):
        self.chamadas = []
        self._resposta = resposta
        self._erro = erro
        self.responses = SimpleNamespace(create=self._create, parse=self._create)

    def _create(self, **kwargs):
        self.chamadas.append(kwargs)
        if self._erro:
            raise self._erro
        return self._resposta


def resposta(texto="Dói ao levantar o braço.", status="completed"):
    return SimpleNamespace(
        output_text=texto,
        model="modelo-x",
        status=status,
        usage=SimpleNamespace(input_tokens=12, output_tokens=8),
    )


def requisicao():
    return AIRequest(
        instructions="Você é um paciente.",
        messages=(
            AIMessage("user", "Onde dói?"),
            AIMessage("assistant", "No ombro."),
            AIMessage("user", "Há quanto tempo?"),
        ),
        max_output_tokens=300,
        temperature=0.8,
    )


def provedor(cliente, **kw):
    return OpenAIProvider(api_key="x", model="modelo-x", client=cliente, **kw)


def test_satisfaz_o_contrato():
    assert isinstance(provedor(ClienteFalso(resposta())), AIProvider)


def test_traduz_request_para_a_responses_api():
    cliente = ClienteFalso(resposta())
    provedor(cliente).generate(requisicao())

    kw = cliente.chamadas[0]
    assert kw["instructions"] == "Você é um paciente."
    assert kw["input"] == [
        {"role": "user", "content": "Onde dói?"},
        {"role": "assistant", "content": "No ombro."},
        {"role": "user", "content": "Há quanto tempo?"},
    ]
    assert kw["max_output_tokens"] == 300
    assert kw["temperature"] == 0.8
    assert kw["store"] is False


def test_devolve_resposta_com_uso_de_tokens():
    out = provedor(ClienteFalso(resposta())).generate(requisicao())
    assert out.content == "Dói ao levantar o braço."
    assert (out.model, out.input_tokens, out.output_tokens) == ("modelo-x", 12, 8)


def test_omite_temperature_quando_desativada():
    cliente = ClienteFalso(resposta())
    provedor(cliente, send_temperature=False).generate(requisicao())
    assert "temperature" not in cliente.chamadas[0]


def test_erro_do_sdk_vira_ai_provider_error_com_causa():
    original = OpenAIError("segredo-interno")
    with pytest.raises(AIProviderError) as info:
        provedor(ClienteFalso(erro=original)).generate(requisicao())
    assert info.value.__cause__ is original
    assert "segredo-interno" not in info.value.public_message


@pytest.mark.parametrize("texto", ["", "   ", None])
def test_texto_vazio_vira_ai_empty_response_error(texto):
    with pytest.raises(AIEmptyResponseError):
        provedor(ClienteFalso(resposta(texto, status="incomplete"))).generate(requisicao())


def test_sem_chave_levanta_ai_unavailable():
    with pytest.raises(AIUnavailableError):
        OpenAIProvider(api_key="", model="modelo-x")


def test_sem_modelo_levanta_ai_unavailable():
    with pytest.raises(AIUnavailableError):
        OpenAIProvider(api_key="x", model="")


def resposta_estruturada(parsed=AVALIACAO, status="completed"):
    return SimpleNamespace(
        output_parsed=parsed, model="modelo-x", status=status,
        usage=SimpleNamespace(input_tokens=20, output_tokens=30),
    )


def test_satisfaz_o_contrato_estruturado():
    assert isinstance(provedor(ClienteFalso(resposta_estruturada())), StructuredAIProvider)


def test_generate_structured_envia_schema_e_devolve_objeto():
    cliente = ClienteFalso(resposta_estruturada())
    out = provedor(cliente).generate_structured(requisicao(), DiagnosisEvaluation)
    assert cliente.chamadas[0]["text_format"] is DiagnosisEvaluation
    assert cliente.chamadas[0]["instructions"] == "Você é um paciente."
    assert out.parsed == AVALIACAO
    assert (out.input_tokens, out.output_tokens) == (20, 30)


def test_generate_structured_sem_objeto_levanta_empty():
    with pytest.raises(AIEmptyResponseError):
        provedor(ClienteFalso(resposta_estruturada(None, "incomplete"))).generate_structured(
            requisicao(), DiagnosisEvaluation
        )


def test_generate_structured_erro_do_sdk_vira_provider_error():
    with pytest.raises(AIProviderError):
        provedor(ClienteFalso(erro=OpenAIError("x"))).generate_structured(
            requisicao(), DiagnosisEvaluation
        )


def test_generate_structured_fora_do_schema_vira_invalid_output():
    try:
        DiagnosisEvaluation.model_validate({})
    except ValidationError as exc:
        erro_pydantic = exc
        pass
    with pytest.raises(AIInvalidOutputError):
        provedor(ClienteFalso(erro=erro_pydantic)).generate_structured(
            requisicao(), DiagnosisEvaluation
        )