from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from accounts.models import User


def _uniqueness_errors(username, email):
    errors = {}
    if User.objects.filter(username=username).exists():
        errors["username"] = ["A user with that username already exists."]
    if User.objects.filter(email__iexact=email).exists():
        errors["email"] = ["Email address already exists."]
    return errors


def register_user(*, username, email, password):
    email = email.lower()

    errors = _uniqueness_errors(username, email)
    try:
        password_validation.validate_password(
            password, user=User(username=username, email=email)
        )
    except DjangoValidationError as exc:
        errors["password"] = list(exc.messages)

    if errors:
        raise serializers.ValidationError(errors)

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username, email=email, password=password
            )
    except IntegrityError:
        errors = _uniqueness_errors(username, email)
        raise serializers.ValidationError(
            errors or {"non_field_errors": ["Could not create account."]}
        )

    return user


def revoke_refresh_token(refresh_token) -> None:
    try:
        RefreshToken(refresh_token).blacklist()
    except TokenError:
        pass
