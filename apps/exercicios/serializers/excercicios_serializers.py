from rest_framework import serializers
from ..models import Exercicio


class ExercicioSerializer(serializers.ModelSerializer):
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = Exercicio
        fields = [
            'id', 'nome', 'descricao', 'como_realizar', 'foto',
            'nivel', 'nivel_display', 'categoria', 'categoria_display',
            'series', 'repeticoes', 'musculo_alvo', 'criado_em',
        ]