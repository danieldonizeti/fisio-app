from rest_framework import serializers
from ..models import Exercicio


class ExercicioResumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercicio
        fields = ['id', 'nome']