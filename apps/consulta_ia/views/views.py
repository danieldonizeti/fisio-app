from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

import logging

from django.conf import settings

from apps.consulta_ia.ai.context.summarizer import ClinicalSummarizer
from apps.consulta_ia.ai.providers.factory import get_ai_provider
from apps.consulta_ia.application.use_cases.send_patient_message import SendPatientMessage
from apps.consulta_ia.domain.exceptions import ConsultaIAError
from apps.consulta_ia.ai.context.factory import get_context_builder
from apps.consulta_ia.application.use_cases.evaluate_diagnosis import EvaluateDiagnosis
from apps.consulta_ia.application.use_cases.start_simulation import StartSimulation

from ..models import SimulacaoConsulta
from ..serializers.consulta_ia_serializer import SimulacaoSerializer
from ..prompts import get_prompt


logger = logging.getLogger(__name__)

_STATUS_POR_CODIGO = {"simulation_closed": 400, "invalid_message": 400, "invalid_diagnosis": 400, "input_too_long":400, "consulta_ia_error": 500, "no_pathology_available": 503}


def _resposta_de_erro(exc: ConsultaIAError) -> Response:
    http_status = _STATUS_POR_CODIGO.get(exc.code, 500)
    if http_status >= 500:
        logger.error("Falha em consulta_ia: %s", exc, exc_info=exc)
    return Response(
        {"detail": exc.public_message, "code": exc.code}, status=http_status
    )


class SimulacaoViewSet(viewsets.ModelViewSet):
    serializer_class = SimulacaoSerializer

    throttle_scopes = {
        'enviar_mensagem': 'ia_mensagem',
        'submeter_diagnostico': 'ia_diagnostico',
    }


    def get_throttles(self):
        escopo = self.throttle_scopes.get(self.action)
        if escopo:
            self.throttle_scope = escopo
            return [ScopedRateThrottle()]
        return super().get_throttles()


    def get_queryset(self):
        return SimulacaoConsulta.objects.filter(fisioterapeuta=self.request.user)


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            simulacao = StartSimulation().execute(
                fisioterapeuta=request.user,
                titulo=serializer.validated_data.get('titulo', ''),
                nivel=serializer.validated_data.get('nivel', 'medio'),
            )
        except ConsultaIAError as exc:
            return _resposta_de_erro(exc)

        return Response(
            self.get_serializer(simulacao).data, status=status.HTTP_201_CREATED
        )


    @action(detail=True, methods=['post'], url_path='enviar-mensagem')
    def enviar_mensagem(self, request, pk=None):
        simulacao = self.get_object()
        provider = get_ai_provider()
        try:
            caso_de_uso = SendPatientMessage(
                provider=provider,
                build_instructions=get_prompt,
                context_builder=get_context_builder(),
                summarizer=ClinicalSummarizer(provider),
                max_message_chars=settings.AI_MAX_USER_MESSAGE_CHARS,
            )
            resposta = caso_de_uso.execute(simulacao, request.data.get('mensagem'))
        except ConsultaIAError as exc:
            return _resposta_de_erro(exc)
        except Exception:
            logger.exception("Erro inesperado em enviar_mensagem")
            return _resposta_de_erro(ConsultaIAError())

        return Response({
            'remetente': resposta.remetente,
            'conteudo': resposta.conteudo,
        })

    

    @action(detail=True, methods=['post'], url_path='submeter-diagnostico')
    def submeter_diagnostico(self, request, pk=None):
        simulacao = self.get_object()
        try:
            caso_de_uso = EvaluateDiagnosis(
                provider=get_ai_provider(),
                max_diagnosis_chars=settings.AI_MAX_DIAGNOSIS_CHARS,
            )
            resultado = caso_de_uso.execute(simulacao, request.data.get('diagnostico'))
        except ConsultaIAError as exc:
            return _resposta_de_erro(exc)
        except Exception:
            logger.exception("Erro inesperado em submeter_diagnostico")
            return _resposta_de_erro(ConsultaIAError())

        return Response({
            'patologia_real': resultado.patologia_real,
            'diagnostico_submetido': resultado.diagnostico_submetido,
            'feedback': resultado.feedback,
            'veredito': resultado.avaliacao.veredito,
            'analise_clinica': resultado.avaliacao.analise_clinica,
            'dica_do_professor': resultado.avaliacao.dica_do_professor,
        })