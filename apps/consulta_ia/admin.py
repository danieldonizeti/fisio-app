from django.contrib import admin
from .models import SimulacaoConsulta, MensagemSimulacao, InteracaoIA


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


admin.register(InteracaoIA)
class InteracaoIAAdmin(admin.ModelAdmin):
    list_display = (
        "id", "simulacao", "tipo", "estado", "erro_codigo",
        "modelo", "tokens_entrada", "tokens_saida", "iniciada_em", "finalizada_em",
    )
    list_filter = ("tipo", "estado", "erro_codigo")
    date_hierarchy = "iniciada_em"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False