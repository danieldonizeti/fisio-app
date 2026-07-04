from rest_framework import serializers
from ..models import Teste
from apps.patologias.serializers.resumo_serializer import PatologiaResumoSerializer




class TesteSerializer(serializers.ModelSerializer):
    estrutura_display = serializers.CharField(source='get_estrutura_display', read_only=True)
    patologias_relacionadas = PatologiaResumoSerializer(source='patologias', many=True, read_only=True)

    class Meta:
        model = Teste
        fields = [
            'id', 'nome', 'estrutura', 'estrutura_display',
            'descricao', 'como_realizar', 'foto',
            'achado_positivo', 'achado_negativo',
            'sensibilidade', 'especificidade', 'patologias_relacionadas', 'criado_em',
        ]