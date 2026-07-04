from rest_framework import serializers
from ..models import Patologia


class PatologiaResumoSerializer(serializers.ModelSerializer):
    regiao_display = serializers.CharField(source='get_regiao_display', read_only=True)

    class Meta:
        model = Patologia
        fields = ['id', 'nome', 'regiao_display']
