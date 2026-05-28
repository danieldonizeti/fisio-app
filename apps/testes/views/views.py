from rest_framework import viewsets, filters
from ..models import Teste
from ..serializers.teste_serializer import TesteSerializer


class TesteViewSet(viewsets.ModelViewSet):
    queryset = Teste.objects.all()
    serializer_class = TesteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'estrutura', 'descricao']