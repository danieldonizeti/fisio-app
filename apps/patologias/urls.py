from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.views import PatologiaViewSet

router = DefaultRouter()
router.register(r'', PatologiaViewSet, basename='patologia')


urlpatterns = [
    path('', include(router.urls)),
]