from django.db import models


class EstruturaAnatomica(models.Model):
    REGIAO_CHOICES = [
        ('cabeca_pescoco', 'Cabeça e Pescoço'),
        ('ombro', 'Ombro'),
        ('braco', 'Braço'),
        ('cotovelo', 'Cotovelo'),
        ('antebraco', 'Antebraço'),
        ('punho_mao', 'Punho e Mão'),
        ('coluna_cervical', 'Coluna Cervical'),
        ('coluna_toracica', 'Coluna Torácica'),
        ('coluna_lombar', 'Coluna Lombar'),
        ('quadril', 'Quadril'),
        ('coxa', 'Coxa'),
        ('joelho', 'Joelho'),
        ('perna', 'Perna'),
        ('tornozelo_pe', 'Tornozelo e Pé'),
    ]

    nome = models.CharField(max_length=200)
    nome_cientifico = models.CharField(max_length=200, blank=True)
    regiao = models.CharField(max_length=30, choices=REGIAO_CHOICES)
    descricao = models.TextField(blank=True)
    foto = models.ImageField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
        ordering = ['nome']

    def __str__(self):
        return self.nome
    

class Musculo(EstruturaAnatomica):
    foto = models.ImageField(upload_to='anatomia/musculos/', blank=True, null=True)
    origem = models.TextField(help_text='Origem do músculo')
    insercao = models.TextField(help_text='Onde o músculo termina')
    funcao = models.TextField(help_text='Qual movimento ele realiza')
    inervacao = models.CharField(max_length=200, blank=True, help_text='Nervo responsável')

    class Meta:
        verbose_name = 'Músculo'
        verbose_name_plural = 'Músculos'
        ordering = ['nome']


class Tendao(EstruturaAnatomica):
    foto = models.ImageField(upload_to='anatomia/tendoes/', blank=True, null=True)
    musculo_associado = models.CharField(max_length=200, blank=True, help_text='Músculo que ele conecta')
    osso_associado = models.CharField(max_length=200, blank=True, help_text='Osso onde se insere')
    funcao = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Tendão'
        verbose_name_plural = 'Tendões'
        ordering = ['nome']


class Ligamento(EstruturaAnatomica):
    foto = models.ImageField(upload_to='anatomia/ligamentos/', blank=True, null=True)
    articulacao = models.CharField(max_length=200, blank=True, help_text='Articulação que estabiliza')
    funcao = models.TextField(blank=True, help_text='Como estabiliza a articulação')
    lesao_comum = models.CharField(max_length=200, blank=True, help_text='Ex: entorse, ruptura')

    class Meta:
        verbose_name = 'Ligamento'
        verbose_name_plural = 'Ligamentos'
        ordering = ['nome']


class Osso(EstruturaAnatomica):
    foto = models.ImageField(upload_to='anatomia/ossos/', blank=True, null=True)
    tipo = models.CharField(
        max_length=20,
        choices=[
            ('longo', 'Longo'),
            ('curto', 'Curto'),
            ('plano', 'Plano'),
            ('irregular', 'Irregular'),
            ('sesamoide', 'Sesamoide'),
        ],
        blank=True
    )
    funcao = models.TextField(blank=True)
    articulacoes_envolvidas = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = 'Osso'
        verbose_name_plural = 'Ossos'
        ordering = ['nome']


class Articulacao(EstruturaAnatomica):
    foto = models.ImageField(upload_to='anatomia/articulacoes/', blank=True, null=True)
    tipo = models.CharField(
        max_length=20,
        choices=[
            ('sinovial', 'Sinovial'),
            ('cartilaginosa', 'Cartilaginosa'),
            ('fibrosa', 'Fibrosa'),
        ],
        blank=True
    )
    ossos_envolvidos = models.CharField(max_length=300, blank=True, help_text='Ex: fêmur, tíbia, patela')
    movimentos_possiveis = models.TextField(blank=True, help_text='Ex: flexão, extensão, rotação')
    estruturas_estabilizadoras = models.TextField(blank=True, help_text='Ligamentos e músculos que estabilizam')

    class Meta:
        verbose_name = 'Articulação'
        verbose_name_plural = 'Articulações'
        ordering = ['nome']