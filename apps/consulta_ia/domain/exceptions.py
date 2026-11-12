class ConsultaIAError(Exception):
    """Base. 'code' é estavel, UI pode depender dele, public_message é o unico texto que pode chegar ao cliente. O argumento detail é interno serve para log e nunca deve ser exposto"""

    code = "consulta_ia_error"
    public_message = "Ocorreu um erro inesperado."

    def __init__(self, detail: str | None = None):
        super().__init__(detail or self.public_message)


class AIUnavailableError(ConsultaIAError):
    code = "ai_unavailable"
    public_message = "O assistente de IA está indisponível no momento."


class AIProviderError(ConsultaIAError):
    code = "ai_provider_error"
    public_message = "Não foi possível obter uma resposta da IA. Tente novamente."


class AIEmptyResponseError(ConsultaIAError):
    code = "ai_empty_response"
    public_message = "A IA não retornou uma resposta. Tente novamente."


class SimulationClosedError(ConsultaIAError):
    code = "simulation_closed"
    public_message = "Esta simulação já foi finalizada."


class InvalidMessageError(ConsultaIAError):
    code = "invalid_message"
    public_message = "Mensagem inválida."


class ContextSummaryError(ConsultaIAError):
    code = "context_summary_error"
    public_message = "Não foi possivel atualizar o resumo da consulta"


class InvalidDiagnosisError(ConsultaIAError):
    code = "invalid_diagnosis"
    public_message = "Informe o diagnóstico."


class AIInvalidOutputError(ConsultaIAError):
    code = "ai_invalid_output"
    public_message = "A IA retornou uma resposta em formato inesperado. Tente novamente."


class InputTooLongError(ConsultaIAError):
    code = "input_too_long"
    public_message = "O texto enviado é longo demais"


class NoPathologyAvailableError(ConsultaIAError):
    code = "no_pathology_available"
    public_message = "Nenhuma patologia cadastrada no momento."