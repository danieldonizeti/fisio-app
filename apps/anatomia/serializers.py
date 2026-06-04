from rest_framework import serializers
from .models import Musculo, Tendao, Ligamento, Osso, Articulacao


class EstruturaAnatomicaSerializer(serializers.ModelSerializer):
    regiao_display = serializers.CharField(
        source='get_regiao_display',
        read_only=True
    )


class MusculoSerializer(EstruturaAnatomicaSerializer):
    class Meta:
        model = Musculo
        fields = [
            'id', 'nome', 'nome_cientifico',
            'regiao', 'regiao_display',
            'descricao', 'foto',
            'origem', 'insercao',
            'funcao', 'inervacao',
            'criado_em',
        ]


class TendaoSerializer(EstruturaAnatomicaSerializer):
    class Meta:
        model = Tendao
        fields = [
            'id', 'nome', 'nome_cientifico',
            'regiao', 'regiao_display',
            'descricao', 'foto',
            'musculo_associado', 'osso_associado',
            'funcao', 'criado_em',
        ]


class LigamentoSerializer(EstruturaAnatomicaSerializer):
    class Meta:
        model = Ligamento
        fields = [
            'id', 'nome', 'nome_cientifico',
            'regiao', 'regiao_display',
            'descricao', 'foto',
            'articulacao', 'funcao',
            'lesao_comum', 'criado_em',
        ]


class OssoSerializer(EstruturaAnatomicaSerializer):
    # Esse campo transforma 'longo' em 'Longo'
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )

    class Meta:
        model = Osso
        fields = [
            'id', 'nome', 'nome_cientifico',
            'regiao', 'regiao_display',
            'descricao', 'foto',
            'tipo', 'tipo_display',
            'funcao', 'articulacoes_envolvidas',
            'criado_em',
        ]


class ArticulacaoSerializer(EstruturaAnatomicaSerializer):
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )

    class Meta:
        model = Articulacao
        fields = [
            'id', 'nome', 'nome_cientifico',
            'regiao', 'regiao_display',
            'descricao', 'foto',
            'tipo', 'tipo_display',
            'ossos_envolvidos',
            'movimentos_possiveis',
            'estruturas_estabilizadoras',
            'criado_em',
        ]