from pydantic import ValidationError
from openai import OpenAI, OpenAIError

from apps.consulta_ia.ai.contracts import AIRequest, AIResponse
from apps.consulta_ia.domain.exceptions import (
    AIEmptyResponseError,
    AIProviderError,
    AIUnavailableError,
)
from apps.consulta_ia.domain.exceptions import AIInvalidOutputError
from apps.consulta_ia.ai.contracts import AIStructuredResponse


class OpenAIProvider:
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        timeout: float = 30.0,
        client=None,
        send_temperature: bool = True,
        reasoning_effort: str | None = None,
    ):

        if not model:
            raise AIUnavailableError("OPENAI_MODEL não configurado.")
        if client is None:
            if not api_key:
                raise AIUnavailableError("OPENAI_API_KEY não configurado")
            client = OpenAI(api_key=api_key, timeout=timeout, max_retries=1)
        self._client = client
        self._model = model
        self._send_temperature = send_temperature
        self._reasoning_effort = reasoning_effort

    
    def _kwargs(self, request: AIRequest) -> dict:
        kwargs = {
            "model": self._model,
            "instructions": request.instructions,
            "input": [{"role": m.role, "content": m.content} for m in request.messages],
            "max_output_tokens": request.max_output_tokens,
            "store": False,
        }

        if self._send_temperature:
            kwargs["temperature"] = request.temperature
        if self._reasoning_effort:
            kwargs["reasoning"] = {"effort": self._reasoning_effort}
        return kwargs


    def generate(self, request: AIRequest) -> AIResponse:

        try:
            response = self._client.responses.create(**self._kwargs(request))
        except OpenAIError as exc:
            raise AIProviderError(f"{type(exc).__name__}: {exc}") from exc

        text = (response.output_text or "").strip()
        if not text:
            raise AIEmptyResponseError(f"status={getattr(response, 'status', None)}")

        usage = getattr(response, "usage", None)
        return AIResponse(
            content=text,
            model=response.model,
            input_tokens=getattr(usage, "input_tokens", None),
            output_tokens=getattr(usage, "output_tokens", None),
        )


    def generate_structured(self, request: AIRequest, schema):
        try:
            response = self._client.responses.parse(
                text_format=schema, **self._kwargs(request)
            )
        except OpenAIError as exc:
            raise AIProviderError(f"{type(exc).__name__}: {exc}") from exc
        except ValidationError as exc:
            raise AIInvalidOutputError(f"Saída fora do schema: {exc}") from exc

        parsed = response.output_parsed
        if parsed is None:
            raise AIEmptyResponseError(f"status={getattr(response, 'status', None)}")

        usage = getattr(response, "usage", None)
        return AIStructuredResponse(
            parsed=parsed,
            model=response.model,
            input_tokens=getattr(usage, "input_tokens", None),
            output_tokens=getattr(usage, "output_tokens", None),
        )
    


    