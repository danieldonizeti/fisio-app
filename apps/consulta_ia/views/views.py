from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
import anthropic
import os

from ..models import SimulacaoConsulta, MensagemSimulacao
from ..serializers.consulta_ia_serializer import SimulacaoSerializer, MensagemSerializer
from ..prompts import get_prompt


class SimulacaoViewSet(viewsets.ModelViewSet):
    serializer_class = SimulacaoSerializer

    def get_queryset(self):
        return SimulacaoConsulta.objects.filter(fisioterapeuta=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(fisioterapeuta=self.request.user)

    @action(detail=True, methods=['post'], url_path='enviar-mensagem')
    def enviar_mensagem(self, request, pk=None):
        simulacao = self.get_object()

        if not simulacao.ativa:
            return Response(
                {'detail': 'Esta simulação já foi finalizada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mensagem_fisio = request.data.get('mensagem', '').strip()
        if not mensagem_fisio:
            return Response(
                {'detail': 'Mensagem não pode ser vazia.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Salvar mensagem do fisioterapeuta
        MensagemSimulacao.objects.create(
            simulacao=simulacao,
            remetente='fisio',
            conteudo=mensagem_fisio
        )

        # Monta o historico para a IA
        historico = simulacao.mensagens.all()
        messages = []   
        for msg in historico:
            role = 'user' if msg.remetente == 'fisio' else 'assistant'
            messages.append({'role': role, 'content': msg.conteudo})
        
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')

        if not api_key:
            return Response(
                {'detail': 'Chave da API Anthropic não configurada.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

        # Chamando a API da IA
        try:
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=300,
                system=get_prompt(simulacao.nivel, simulacao.patologia_simulada),
                messages=messages
            )
            resposta_ia = response.content[0].text
        
        except Exception as e:
            return Response(
                {'detail': f'Erro ao contatar IA: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

        # Salvando a resposta
        MensagemSimulacao.objects.create(
            simulacao=simulacao,
            remetente='paciente',
            conteudo=resposta_ia
        )

        return Response({
            'remetente': 'paciente',
            'conteudo': resposta_ia,
        })
    
    @action(detail=True, methods=['post'], url_path='finalizar')
    def finalizar(self, request, pk=None):
        simulacao = self.get_object()
        simulacao.ativa = False
        simulacao.finalizado_em = timezone.now()
        simulacao.save()
        return Response({'detail': 'Simulação finalizada com sucesso.'})

    @action(detail=True, methods=['get'], url_path='historico')
    def historico(self, request, pk=None):
        simulacao = self.get_object()
        mensagens = simulacao.mensagens.all()
        return Response(MensagemSerializer(mensagens, many=True).data)