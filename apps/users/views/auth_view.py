from rest_framework_simplejwt.views import TokenObtainPairView
from apps.users.serializers.auth_serializer import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer