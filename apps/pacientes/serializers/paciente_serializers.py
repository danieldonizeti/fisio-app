from rest_framework import serializers
from ..models import Paciente, Anamnese, SessaoFisioterapia


class AnamneseSerializer(serializers.ModelSerializer):
    imc = serializers.FloatField(read_only=True)

    class Meta:
        model = Anamnese
        fields = '__all__'
        read_only_fields = ['paciente']


class SessaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessaoFisioterapia
        fields = '__all__'
        read_only_fields = ['fisioterapeuta', 'paciente', 'numero_sessao']


class PacienteSerializer(serializers.ModelSerializer):
    idade = serializers.IntegerField(read_only=True)
    anamnese = AnamneseSerializer(read_only=True)
    sessoes = SessaoSerializer(many=True, read_only=True)
    total_sessoes = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = [
            'id', 'nome', 'data_nascimento', 'idade', 'sexo',
            'estado_civil', 'profissao', 'telefone', 'email',
            'endereco', 'foto', 'ativo', 'total_sessoes',
            'anamnese', 'sessoes', 'criado_em',
        ]
        read_only_fields = ['fisioterapeuta']

    def get_total_sessoes(self, obj):
        return obj.sessoes.count()


class PacienteListSerializer(serializers.ModelSerializer):
    """simples para listas sem sessões completas"""
    idade = serializers.IntegerField(read_only=True)
    total_sessoes = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = [
            'id', 'nome', 'data_nascimento', 'idade',
            'sexo', 'telefone', 'ativo', 'total_sessoes', 'foto',
        ]

    def get_total_sessoes(self, obj):
        return obj.sessoes.count()