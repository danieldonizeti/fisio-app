from django.db import models
from django.conf import settings
from django.utils import timezone


class SimulacaoConsulta(models.Model):
    NIVEL_CHOICES = [
        ('facil', 'Fácil - Paciente colaborativo, sintomas claros'),
        ('medio', 'Médio - Paciente com algumas dificuldades de comunicação'),
        ('dificil', 'Difícil - Paciente confuso, sintomas vagos, historico complexo')
    ]

    fisioterapeuta = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='simulacoes'
    )

    titulo = models.CharField(max_length=200, blank=True)
    nivel = models.CharField(max_length=10, choices=NIVEL_CHOICES, default='medio')
    patologia_simulada = models.CharField(
        max_length=200, blank=True,
        help_text='Patologia que o paciente virtual possui (oculto do profissional)'
    )
    ativa = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    finalizado_em = models.DateTimeField(null=True, blank=True)

    resumo_clinico = models.JSONField(default=dict, blank=True)
    resumo_ate_mensagem_id = models.PositiveBigIntegerField(null=True, blank=True)

    class Meta:
        verbose_name = 'Simulação de Consulta'
        verbose_name_plural = 'Simulações de Consulta'
        ordering = ['-criado_em']
    
    def __str__(self):
        return f'Simulação {self.nivel} — {self.fisioterapeuta.email} ({self.criado_em.strftime("%d/%m/%Y")})'
    

class MensagemSimulacao(models.Model):
    REMETENTE_CHOICES = [
        ('fisio', 'Fisioterapeuta'),
        ('paciente', 'Paciente (IA)')
    ]

    simulacao = models.ForeignKey(
        SimulacaoConsulta,
        on_delete=models.CASCADE,
        related_name='mensagens'
    )

    remetente = models.CharField(max_length=10, choices=REMETENTE_CHOICES)
    conteudo = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['criado_em', 'id']
    
    def __str__(self):
        return f'[{self.remetente}] {self.conteudo[:50]}'


class InteracaoIA(models.Model):
    class Tipo(models.TextChoices):
        MENSAGEM = "mensagem"
        DIAGNOSTICO = "diagnostico"

    class Estado(models.TextChoices):
        PROCESSANDO = "processando"
        CONCLUIDA = "concluida"
        FALHOU = "falhou"

    simulacao = models.ForeignKey(
        SimulacaoConsulta, on_delete=models.CASCADE, related_name="interacoes"
    )
    tipo = models.CharField(max_length=12, choices=Tipo.choices)
    estado = models.CharField(
        max_length=12, choices=Estado.choices, default=Estado.PROCESSANDO
    )
    erro_codigo = models.CharField(max_length=50, blank=True)
    modelo = models.CharField(max_length=100, blank=True)
    tokens_entrada = models.PositiveIntegerField(null=True, blank=True)
    tokens_saida = models.PositiveIntegerField(null=True, blank=True)
    iniciada_em = models.DateTimeField(default=timezone.now)
    finalizada_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["simulacao"],
                condition=models.Q(estado="processando"),
                name="uma_interacao_processando_por_simulacao",
            )
        ]