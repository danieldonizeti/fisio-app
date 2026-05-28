from rest_framework import viewsets, filters
from ..models import Exercicio
from ..serializers.excercicios_serializers import ExercicioSerializer


class ExercicioViewSet(viewsets.ModelViewSet):
    queryset = Exercicio.objects.all()
    serializer_class = ExercicioSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'musculo_alvo', 'categoria']