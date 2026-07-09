from django.db import models


class Patologia(models.Model):
    REGIAO_CHOICES = [
        ('ombro', 'Ombro'),
        ('joelho', 'Joelho'),
        ('quadril', 'Quadril'),
        ('coluna', 'Coluna'),
        ('cotovelo', 'Cotovelo'),
        ('punho', 'Punho'),
        ('tornozelo', 'Tornozelo'),
        ('outros', 'Outros'),
    ]

    nome = models.CharField(max_length=200)
    regiao = models.CharField(max_length=20, choices=REGIAO_CHOICES)
    descricao = models.TextField()
    foto = models.ImageField(upload_to='fisioapp/patologias/', blank=True, null=True)
    causas = models.TextField(blank=True)
    tratamento = models.TextField(blank=True)

    testes_relacionados = models.ManyToManyField(
        'testes.Teste',
        blank=True,
        related_name='patologias'
    )
    exercicios_relacionados = models.ManyToManyField(
        'exercicios.Exercicio',
        blank=True,
        related_name='patologias'
    )

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Patologia'
        verbose_name_plural = 'Patologias'
        ordering = ['nome']

    def __str__(self):
        return self.nome
    

class SintomaPatologia(models.Model):
    patologia = models.ForeignKey(
        Patologia, on_delete=models.CASCADE, related_name='sintomas_relacionados'
    )
    descricao = models.CharField(max_length=200)

    class Meta:
        verbose_name = 'Sintoma'
        verbose_name_plural = 'Sintomas'

    def __str__(self):
        return f'{self.patologia.nome} - {self.descricao}'


