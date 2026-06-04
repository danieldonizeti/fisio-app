from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.users.models import User
from apps.users.serializers.user_serializer import UserSerializer, CreateUserSerializer, MeSerializer
from rest_framework import viewsets, status

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return User.objects.filter(pk=self.request.user.pk)
        return User.objects.none()
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateUserSerializer
        if self.action == 'me':
            return MeSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        if request.method == 'GET':
            serializer = MeSerializer(request.user)
            return Response(serializer.data)
        
        serializer = MeSerializer(request.user, data=request.data, partia=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)