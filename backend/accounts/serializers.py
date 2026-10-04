from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers

from accounts.models import User


class RegisterInputSerializer(serializers.Serializer):
    username = serializers.CharField(
        max_length=150,
        validators=[UnicodeUsernameValidator()],
    )
    email = serializers.EmailField(
        max_length=254,
        error_messages={
            "required": "Email is required.",
            "blank": "Email is required.",
            "invalid": "Enter a valid email address.",
        },
    )
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        error_messages={
            "required": "Password is required.",
            "blank": "Password is required.",
        },
    )


class UserOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]
        read_only_fields = fields


class LogoutInputSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        error_messages={
            "required": "Refresh token is required.",
            "blank": "Refresh token is required.",
        },
    )
