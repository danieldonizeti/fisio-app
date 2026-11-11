from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.patologias.models import Patologia
import random
import logging

from apps.consulta_ia.ai.context.summarizer import ClinicalSummarizer

from apps.consulta_ia.ai.providers.factory import get_ai_provider
from apps.consulta_ia.application.use_cases.send_patient_message import SendPatientMessage
from apps.consulta_ia.domain.exceptions import ConsultaIAError
from apps.consulta_ia.ai.context.factory import get_context_builder
from apps.consulta_ia.application.use_cases.evaluate_diagnosis import EvaluateDiagnosis

from ..models import SimulacaoConsulta
from ..serializers.consulta_ia_serializer import SimulacaoSerializer
from ..prompts import get_prompt


logger = logging.getLogger(__name__)

_STATUS_POR_CODIGO = {"simulation_closed": 400, "invalid_message": 400, "invalid_diagnosis": 400}


def _resposta_de_erro(exc: ConsultaIAError) -> Response:
    http_status = _STATUS_POR_CODIGO.get(exc.code, 500)
    if http_status >= 500:
        logger.error("Falha em consulta_ia: %s", exc, exc_info=exc)
    return Response(
        {"detail": exc.public_message, "code": exc.code}, status=http_status
    )



class SimulacaoViewSet(viewsets.ModelViewSet):
    serializer_class = SimulacaoSerializer

    def get_queryset(self):
        return SimulacaoConsulta.objects.filter(fisioterapeuta=self.request.user)

    def perform_create(self, serializer):
        serializer.save(fisioterapeuta=self.request.user)

    @action(detail=False, methods=['get'], url_path='patologia-aleatoria')
    def patologia_aleatoria(self, request):
        patologias = Patologia.objects.all()
        if not patologias.exists():
            return Response(
                {'detail': 'Nenhuma patologia cadastrada.'},
                status=status.HTTP_404_NOT_FOUND
            )
        patologia = random.choice(patologias)
        return Response({
            'id': patologia.id,
            'nome': patologia.nome,
            'regiao': patologia.get_regiao_display(),
        })


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
            caso_de_uso = EvaluateDiagnosis(provider=get_ai_provider())
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