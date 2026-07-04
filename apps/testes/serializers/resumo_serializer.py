from rest_framework import serializers
from ..models import Teste


class TesteResumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teste
        fields = ['id', 'nome']