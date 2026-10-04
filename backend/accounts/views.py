from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .serializers import (
    LogoutInputSerializer,
    RegisterInputSerializer,
    UserOutputSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        input_serializer = RegisterInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        user = services.register_user(**input_serializer.validated_data)

        output_serializer = UserOutputSerializer(user)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LogoutInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.revoke_refresh_token(request.data.get("refresh"))
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserOutputSerializer(request.user).data)
