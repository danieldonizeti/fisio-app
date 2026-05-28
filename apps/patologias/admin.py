from django.contrib import admin
from .models import Patologia, SintomaPatologia


class SintomaInline(admin.TabularInline):
    model = SintomaPatologia
    extra = 3


@admin.register(Patologia)
class PatologiaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'regiao', 'criado_em']
    list_filter = ['regiao']
    search_fields = ['nome']
    filter_horizontal = ['testes_relacionados', 'exercicios_relacionados']
    inlines = [SintomaInline]