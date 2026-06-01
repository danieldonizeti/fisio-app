from rest_framework import serializers
from ..models import SimulacaoConsulta, MensagemSimulacao


class MensagemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MensagemSimulacao
        fields = ['id', 'remetente', 'conteudo', 'criado_em']


class SimulacaoSerializer(serializers.ModelSerializer):
    mensagens = MensagemSerializer(many=True, read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    total_mensagens = serializers.SerializerMethodField()

    class Meta:
        model = SimulacaoConsulta
        fields = [
            'id', 'titulo', 'nivel', 'nivel_display',
            'patologia_simulada', 'ativa', 'total_mensagens',
            'mensagens', 'criado_em', 'finalizado_em',
        ]
        read_only_fields = ['fisioterapeuta']

    def get_total_mensagens(self, obj):
        return obj.mensagens.count()