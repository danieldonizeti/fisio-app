from rest_framework import viewsets, filters
from .models import Musculo, Tendao, Ligamento, Osso, Articulacao
from .serializers import (
    MusculoSerializer, TendaoSerializer, LigamentoSerializer,
    OssoSerializer, ArticulacaoSerializer
)


class AnatomiaBaseViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'nome_cientifico', 'regiao', 'descricao']
    ordering_fields = ['nome', 'regiao', 'criado_em']


class MusculoViewSet(AnatomiaBaseViewSet):
    queryset = Musculo.objects.all()
    serializer_class = MusculoSerializer
    search_fields = ['nome', 'nome_cientifico', 'regiao', 'origem', 'insercao', 'funcao']


class TendaoViewSet(AnatomiaBaseViewSet):
    queryset = Tendao.objects.all()
    serializer_class = TendaoSerializer
    search_fields = ['nome', 'nome_cientifico', 'regiao', 'musculo_associado']


class LigamentoViewSet(AnatomiaBaseViewSet):
    queryset = Ligamento.objects.all()
    serializer_class = LigamentoSerializer
    search_fields = ['nome', 'nome_cientifico', 'regiao', 'articulacao']


class OssoViewSet(AnatomiaBaseViewSet):
    queryset = Osso.objects.all()
    serializer_class = OssoSerializer


class ArticulacaoViewSet(AnatomiaBaseViewSet):
    queryset = Articulacao.objects.all()
    serializer_class = ArticulacaoSerializer
    search_fields = ['nome', 'nome_cientifico', 'regiao', 'ossos_envolvidos']