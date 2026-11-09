import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

_CHAVE = re.compile(r"^[a-z]+(?:_[a-z0-9]+)*$")


class ClinicalFact(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: str = Field(min_length=1, max_length=200)
    source: Literal["patient_statement"] = "patient_statement"
    confidence: Literal["explicit", "implied"] = "explicit"


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
        