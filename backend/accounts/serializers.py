from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        error_messages={
            "required": "Password is required.",
            "blank": "Password is required.",
        },
    )
    email = serializers.EmailField(
        error_messages={
            "required": "Email is required.",
            "blank": "Email is required.",
            "invalid": "Enter a valid email address.",
        },
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]

    def validate_email(self, value):
        email = value.lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email address already exists.")
        return email

    def validate_password(self, value):
        user = User(
            username=self.initial_data.get("username"),
            email=self.initial_data.get("email"),
        )
        try:
            password_validation.validate_password(value, user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
