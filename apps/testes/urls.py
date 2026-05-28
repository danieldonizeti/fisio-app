from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.views import TesteViewSet

router = DefaultRouter()
router.register(r'', TesteViewSet, basename='teste')

urlpatterns = [path('', include(router.urls))]