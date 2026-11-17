import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

_CHAVE = re.compile(r"^[a-z]+(?:_[a-z0-9]+)*$")


class ClinicalFact(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: str = Field(min_length=1, max_length=200)
    source: Literal["patient_statement"] = "patient_statement"
    confidence: Literal["explicit", "implied"] = "explicit"

    @field_validator("value", mode="before")
    @classmethod
    def encurtar(cls, valor):
        if isinstance(valor, str):
            valor = valor.strip()
            if len(valor) > 200:
                valor = valor[:199].rstrip() + "…"
        return valor


class ClinicalSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")
    facts: dict[str, ClinicalFact] = Field(default_factory=dict, max_length=25)

    @field_validator("facts")
    @classmethod
    def chaves_em_snake_case(cls, facts):
        for chave in facts:
            if not _CHAVE.match(chave):
                raise ValueError(f"Chave inválida: {chave!r}")
        return facts


class DiagnosisEvaluation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    veredito: Literal["correto", "proximo", "incorreto"]
    analise_clinica: str
    dica_do_professor: str

    @field_validator("analise_clinica", "dica_do_professor")
    @classmethod
    def texto_valido(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor or len(valor) > 600:
            raise ValueError("Texto vazio ou longo demais")
        return valor