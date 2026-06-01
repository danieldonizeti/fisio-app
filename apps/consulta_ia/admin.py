from django.contrib import admin
from .models import SimulacaoConsulta, MensagemSimulacao


class MensagemInline(admin.TabularInline):
    model = MensagemSimulacao
    extra = 0
    readonly_fields = ['remetente', 'conteudo', 'criado_em']
    can_delete = False


@admin.register(SimulacaoConsulta)
class SimulacaoAdmin(admin.ModelAdmin):
    list_display = ['fisioterapeuta', 'nivel', 'patologia_simulada', 'ativa', 'criado_em']
    list_filter = ['nivel', 'ativa']
    inlines = [MensagemInline]