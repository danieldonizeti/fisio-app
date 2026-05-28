from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.views import ExercicioViewSet

router = DefaultRouter()
router.register(r'', ExercicioViewSet, basename='exercicio')

urlpatterns = [path('', include(router.urls))]
