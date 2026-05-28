from django.db import models


class Exercicio(models.Model):
    NIVEL_CHOICES = [
        ('iniciante', 'Iniciante'),
        ('intermediario', 'Intermediário'),
        ('avancado', 'Avançado'),
    ]

    CATEGORIA_CHOICES = [
        ('fortalecimento', 'Fortalecimento'),
        ('alongamento', 'Alongamento'),
        ('propriocepcao', 'Propriocepção'),
        ('mobilidade', 'Mobilidade'),
        ('aerobico', 'Aeróbico'),
    ]

    nome = models.CharField(max_length=200)
    descricao = models.TextField()
    como_realizar = models.TextField()
    foto = models.ImageField(upload_to='exercicios/', blank=True, null=True)
    nivel = models.CharField(max_length=20, choices=NIVEL_CHOICES)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    series = models.PositiveIntegerField(default=3)
    repeticoes = models.CharField(max_length=50, default='10-15', help_text='Ex: 10-15 ou 30 segundos')
    musculo_alvo = models.CharField(max_length=200)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Exercício'
        verbose_name_plural = 'Exercícios'
        ordering = ['nome']

    def __str__(self):
        return f'{self.nome} ({self.get_nivel_display()})'