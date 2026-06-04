from django.contrib import admin
from .models import Musculo, Tendao, Ligamento, Osso, Articulacao


# Classe base do admin — mesma lógica de herança
class AnatomiaAdmin(admin.ModelAdmin):
    list_filter = ['regiao']
    search_fields = ['nome', 'nome_cientifico']


@admin.register(Musculo)
class MusculoAdmin(AnatomiaAdmin):
    list_display = ['nome', 'nome_cientifico', 'regiao', 'inervacao']


@admin.register(Tendao)
class TendaoAdmin(AnatomiaAdmin):
    list_display = ['nome', 'regiao', 'musculo_associado']


@admin.register(Ligamento)
class LigamentoAdmin(AnatomiaAdmin):
    list_display = ['nome', 'regiao', 'articulacao', 'lesao_comum']


@admin.register(Osso)
class OssoAdmin(AnatomiaAdmin):
    list_display = ['nome', 'regiao', 'tipo']


@admin.register(Articulacao)
class ArticulacaoAdmin(AnatomiaAdmin):
    list_display = ['nome', 'regiao', 'tipo']