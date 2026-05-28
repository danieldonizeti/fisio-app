from rest_framework import viewsets, filters
from ..models import Patologia
from ..serializers.patologia_serializer import PatologiaSerializer


class PatologiaViewSet(viewsets.ModelViewSet):
    queryset = Patologia.objects.all()
    serializer_class = PatologiaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'sintomas', 'descricao']
    ordering_fields = ['nome', 'criado_em']