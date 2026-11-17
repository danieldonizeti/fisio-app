from dataclasses import dataclass
from typing import Literal, Protocol, runtime_checkable, Generic, TypeVar
from pydantic import BaseModel

role = Literal["user", "assistant"]

T = TypeVar("T", bound=BaseModel)


@dataclass(frozen=True)
class AIMessage:
    role: role
    content: str

    def __post_init__(self):
        if self.role not in ("user", "assistant"):
            raise ValueError(f"Role invalido: {self.role!r}")


@dataclass(frozen=True)
class AIRequest:
    instructions: str
    messages: tuple[AIMessage, ...]
    max_output_tokens: int = 500
    temperature: float = 0.7

    def __post_init__(self):
        if not self.messages:
            raise ValueError("AIRequest precisa de ao menos uma mensagem.")
        if self.max_output_tokens <= 0:
            raise ValueError("max_output_tokens deve ser positivo.")


@dataclass(frozen=True)
class AIResponse:
    content: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


@runtime_checkable
class AIProvider(Protocol):
    def generate(self, request: AIRequest) -> AIResponse:
        ...


@dataclass(frozen=True)
class AIStructuredResponse(Generic[T]):
    parsed: T
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


@runtime_checkable
class StructuredAIProvider(AIProvider, Protocol):
    def generate_structured(
            self, request: AIRequest, schema: type[T]
    ) -> AIStructuredResponse[T]:
        ...