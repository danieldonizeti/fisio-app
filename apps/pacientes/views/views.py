from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Paciente, Anamnese, SessaoFisioterapia
from apps.pacientes.serializers.paciente_serializers import (
    PacienteSerializer, PacienteListSerializer,
    AnamneseSerializer, SessaoSerializer
)


class PacienteViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'email', 'telefone']
    ordering_fields = ['nome', 'criado_em']

    def get_queryset(self):
        return Paciente.objects.filter(fisioterapeuta=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'lsit':
            return PacienteListSerializer
        return PacienteSerializer
    
    def perform_create(self, serializer):
        serializer.save(fisioterapeuta=self.request.user)

    @action(detail=True, methods=['post', 'get'], url_path='anamnese')
    def anamnese(self, request, pk=None):
        paciente = self.get_object()

        if request.method == 'GET':
            try:
                anamnese = paciente.anamnese
                return Response(AnamneseSerializer(anamnese).data)
            except Anamnese.DoesNotExist:
                return Response({'detail': 'Anamnese não encontrada'}, status=404)
        
        # POST CRIAR OU ATUALIZAR
        try:
            anamnese = paciente.anamnese
            serializer = AnamneseSerializer(anamnese, data=request.data, partial=True)
        except Anamnese.DoesNotExist:
            serializer = AnamneseSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save(paciente=paciente)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get', 'post'], url_path='sessoes')
    def sessoes(self, request, pk=None):
        paciente = self.get_object()

        if request.method == 'GET':
            sessoes = paciente.sessoes.all()
            return Response(SessaoSerializer(sessoes, many=True).data)

        serializer = SessaoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        numero = paciente.sessoes.count() + 1
        serializer.save(paciente=paciente, fisioterapeuta=request.user, numero_sessao=numero)
        return Response(serializer.data, status=status.HTTP_201_CREATED)