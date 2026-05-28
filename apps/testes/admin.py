from django.contrib import admin
from .models import Teste


@admin.register(Teste)
class TesteAdmin(admin.ModelAdmin):
    list_display = ['nome', 'estrutura', 'sensibilidade', 'especificidade']
    list_filter = ['estrutura']
    search_fields = ['nome']