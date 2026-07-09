from django.db import models


class Teste(models.Model):
    ESTRUTURA_CHOICES = [
        ('ombro', 'Ombro'),
        ('joelho', 'Joelho'),
        ('quadril', 'Quadril'),
        ('coluna', 'Coluna'),
        ('cotovelo', 'Cotovelo'),
        ('punho', 'Punho'),
        ('tornozelo', 'Tornozelo'),
        ('outros', 'Outros'),
    ]

    nome = models.CharField(max_length=100)
    estrutura = models.CharField(max_length=50, choices=ESTRUTURA_CHOICES)
    descricao = models.TextField()
    como_realizar = models.TextField()
    foto = models.ImageField(upload_to='fisioapp/testes/', blank=True, null=True)
    achado_positivo = models.TextField(help_text='O que indica quando positivo')
    achado_negativo = models.TextField(blank=True, help_text='O que indica quando negativo')
    sensibilidade = models.CharField(max_length=20, blank=True, help_text='Ex: 72%')
    especificidade = models.CharField(max_length=20, blank=True, help_text='Ex: 66%')

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Teste Especial'
        verbose_name_plural = 'Testes Especiais'
        ordering = ['nome']
    
    def __str__(self):
        return f'{self.nome} ({self.get_estrutura_display()})'
