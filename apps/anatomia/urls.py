from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MusculoViewSet, TendaoViewSet, LigamentoViewSet,
    OssoViewSet, ArticulacaoViewSet
)


router = DefaultRouter()
router.register(r'musculos', MusculoViewSet, basename='musculo')
router.register(r'tendoes', TendaoViewSet, basename='tendao')
router.register(r'ligamentos', LigamentoViewSet, basename='ligamento')
router.register(r'ossos', OssoViewSet, basename='osso')
router.register(r'articulacoes', ArticulacaoViewSet, basename='articulacao')

urlpatterns = [path('', include(router.urls))]