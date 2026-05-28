from django.contrib import admin
from .models import Exercicio


@admin.register(Exercicio)
class ExercicioAdmin(admin.ModelAdmin):
    list_display = ['nome', 'nivel', 'categoria', 'series', 'repeticoes']
    list_filter = ['nivel', 'categoria']
    search_fields = ['nome', 'musculo_alvo']