from rest_framework import serializers
from ..models import Patologia, SintomaPatologia
from apps.testes.serializers.resumo_serializer import TesteResumoSerializer
from apps.exercicios.serializers.resumo_exercicios_serializers import ExercicioResumoSerializer


class SintomaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SintomaPatologia
        fields = ['id', 'descricao']


class PatologiaSerializer(serializers.ModelSerializer):
    sintomas_relacionados = SintomaSerializer(many=True, read_only=True)
    testes_relacionados = TesteResumoSerializer(many=True, read_only=True)
    exercicios_relacionados = ExercicioResumoSerializer(many=True, 
    read_only=True)
    regiao_display = serializers.CharField(source='get_regiao_display', read_only=True)

    class Meta:
        model = Patologia
        fields = [
            'id', 'nome', 'regiao', 'regiao_display',
            'descricao', 'foto','causas','tratamento', 'sintomas_relacionados',
            'testes_relacionados',
            'exercicios_relacionados',
            'criado_em',
        ]