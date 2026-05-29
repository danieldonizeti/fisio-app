from django.db import models
from django.conf import settings


class Paciente(models.Model):
    SEXO_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Feminino'),
        ('O', 'Outro')
    ]

    ESTADO_CIVIL_CHOICES = [
        ('solteiro', 'Solteiro(a)'),
        ('casado', 'Casado(a)'),
        ('divorciado', 'Divorciado(a)'),
        ('viuvo', 'Viúvo(a)'),
        ('uniao_estavel', 'União Estável'),
    ]

    #Pessoais
    fisioterapeuta = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pacientes'
    )
    nome = models.CharField(max_length=100)
    data_nascimento = models.DateField()
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES)
    estado_civil = models.CharField(max_length=20, choices=ESTADO_CIVIL_CHOICES, blank=True)
    profissao = models.CharField(max_length=100, blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    endereco = models.TextField(blank=True)

    foto = models.ImageField(upload_to='pacientes/', blank=True, null=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'
        ordering = ['nome']

    def __str__(self):
        return self.nome
    
    @property
    def idade(self):
        from datetime import date
        hoje = date.today()
        return hoje.year - self.data_nascimento.year - (
            (hoje.month, hoje.day) < (self.data_nascimento.month, self.data_nascimento.day)
        )


class Anamnese(models.Model):
    INTENSIDADE_CHOICES = [
        (0, '0 — Sem dor'),
        (1, '1'), (2, '2'), (3, '3'), (4, '4'),
        (5, '5 — Dor moderada'),
        (6, '6'), (7, '7'), (8, '8'), (9, '9'),
        (10, '10 — Pior dor possível'),
    ]

    paciente = models.OneToOneField(
        Paciente, on_delete=models.CASCADE, related_name='anamnese'
    )

    #Queixa principal
    queixa_principal = models.TextField(help_text='Motivo principal da consulta')
    historia_doenca_atual = models.TextField(help_text='Inicio, evolução e caracteristicas da queixa')

    #A dor
    localizacao_dor = models.CharField(max_length=200, blank=True)
    intensidade_dor = models.IntegerField(choices=INTENSIDADE_CHOICES, default=0)
    tipo_dor = models.CharField(
        max_length=100, blank=True,
        help_text='Ex: queimação, pontada, pressão, etc.'
    )
    dor_irradia = models.BooleanField(default=False)
    irradiacao_descricao = models.CharField(max_length=200, blank=True)
    fatores_piora = models.TextField(blank=True, help_text='O que piora a dor ?')
    fatores_melhora = models.TextField(blank=True, help_text='O que melhora a dor ?')

    #O historico
    antecedentes_pessoais = models.TextField(blank=True, help_text='Doenças, cirurgias, internações anteriores')
    antecedentes_familiares = models.TextField(blank=True)
    medicamentos_em_uso = models.TextField(blank=True)
    alergias = models.TextField(blank=True)
    tratamentos_anteriores = models.TextField(blank=True, help_text='Fisioterapia, médico, etc.')

    # Hábitos e estilo de vida
    atividade_fisica = models.BooleanField(default=False)
    descricao_atividade_fisica = models.CharField(max_length=200, blank=True)
    tabagismo = models.BooleanField(default=False)
    etilismo = models.BooleanField(default=False)
    profissao_relevante = models.TextField(blank=True, help_text='Aspectos da profissão que impactam a queixa')

    # Medidas e dados clínicos
    peso = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    altura = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    pressao_arterial = models.CharField(max_length=20, blank=True, help_text='Ex: 120/80')
    frequencia_cardiaca = models.PositiveIntegerField(null=True, blank=True)

    # Objetivos e observações
    objetivo_paciente = models.TextField(blank=True, help_text='O que o paciente espera do tratamento?')
    observacoes = models.TextField(blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Anamnese'
        verbose_name_plural = 'Anamneses'

    def __str__(self):
        return f'Anamnese — {self.paciente.nome}'

    @property
    def imc(self):
        if self.peso and self.altura:
            return round(float(self.peso) / (float(self.altura) ** 2), 1)
        return None


class SessaoFisioterapia(models.Model):
    paciente = models.ForeignKey(
        Paciente, on_delete=models.CASCADE, related_name='sessoes'
    )
    fisioterapeuta = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessoes'
    )
    data = models.DateField()
    numero_sessao = models.PositiveIntegerField()
    queixa_sessao = models.TextField(blank=True, help_text='Como o paciente chegou hoje?')
    procedimentos = models.TextField(help_text='O que foi realizado na sessão')
    evolucao = models.TextField(blank=True, help_text='Progresso observado')
    intensidade_dor_atual = models.IntegerField(
        choices=Anamnese.INTENSIDADE_CHOICES, default=0
    )
    proxima_sessao = models.DateField(null=True, blank=True)
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sessão'
        verbose_name_plural = 'Sessões'
        ordering = ['-data']

    def __str__(self):
        return f'Sessão {self.numero_sessao} — {self.paciente.nome} ({self.data})'