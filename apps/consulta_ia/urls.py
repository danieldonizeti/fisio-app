from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.views import SimulacaoViewSet

router = DefaultRouter()
router.register(r'', SimulacaoViewSet, basename='simulacao')

urlpatterns = [path('', include(router.urls))]