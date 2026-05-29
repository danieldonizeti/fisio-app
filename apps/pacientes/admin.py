from django.contrib import admin
from .models import Paciente, Anamnese, SessaoFisioterapia


class AnamneseInline(admin.StackedInline):
    model = Anamnese
    extra = 0
    can_delete = False


class SessaoInline(admin.TabularInline):
    model = SessaoFisioterapia
    extra = 0
    fields = ['data', 'numero_sessao', 'procedimentos', 'intensidade_dor_atual']
    readonly_fields = ['numero_sessao']


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ['nome', 'idade', 'sexo', 'telefone', 'ativo', 'criado_em']
    list_filter = ['sexo', 'ativo']
    search_fields = ['nome', 'email', 'telefone']
    inlines = [AnamneseInline, SessaoInline]


@admin.register(SessaoFisioterapia)
class SessaoAdmin(admin.ModelAdmin):
    list_display = ['paciente', 'numero_sessao', 'data', 'intensidade_dor_atual']
    list_filter = ['data']
    search_fields = ['paciente__nome']