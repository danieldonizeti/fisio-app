from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views.auth_view import CustomTokenObtainPairView

from rest_framework.routers import DefaultRouter

from apps.users.views.user_view import UserViewSet

router = DefaultRouter()
router.register(f'users', UserViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include(router.urls)),

    #Autenticação
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    #apps
    path('api/patologias/', include('apps.patologias.urls')),
    path('api/teste/', include('apps.testes.urls')),
    path('api/exercicios/', include('apps.exercicios.urls')),
    path('api/pacientes/', include('apps.pacientes.urls')),
    path('api/consulta-ia/', include('apps.consulta_ia.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)