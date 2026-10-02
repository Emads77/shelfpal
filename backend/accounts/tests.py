from unittest.mock import patch

from django.db import IntegrityError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

STRONG_PASSWORD = "Sax10n-Advanc3dD3v-2026!"


class RegisterViewTests(APITestCase):
    url = reverse("register")

    def payload(self, **overrides):
        data = {
            "username": "reader",
            "email": "reader@examplemail.com",
            "password": STRONG_PASSWORD,
        }
        data.update(overrides)
        return data

    def test_valid_registration_creates_user(self):
        response = self.client.post(
            self.url, self.payload(email="Reader@Examplemail.COM")
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(set(response.data), {"id", "username", "email"})
        self.assertEqual(response.data["email"], "reader@examplemail.com")

        user = User.objects.get(pk=response.data["id"])
        self.assertTrue(user.check_password(STRONG_PASSWORD))

    def test_duplicate_email_is_rejected_case_insensitive(self):
        User.objects.create_user(
            username="someone", email="reader@examplemail.com", password=STRONG_PASSWORD
        )

        response = self.client.post(
            self.url, self.payload(email="READER@examplemail.com")
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["email"], ["Email address already exists."])
        self.assertEqual(User.objects.count(), 1)

    def test_duplicate_username_is_rejected(self):
        User.objects.create_user(
            username="reader", email="other@examplemail.com", password=STRONG_PASSWORD
        )

        response = self.client.post(self.url, self.payload())

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
        self.assertEqual(User.objects.count(), 1)

    def test_weak_password_is_rejected(self):
        response = self.client.post(self.url, self.payload(password="12345678"))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertEqual(User.objects.count(), 0)

    def test_email_and_password_errors_are_reported_together(self):
        User.objects.create_user(
            username="someone", email="reader@examplemail.com", password=STRONG_PASSWORD
        )

        response = self.client.post(self.url, self.payload(password="12345678"))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("password", response.data)

    def test_missing_fields_use_custom_messages(self):
        response = self.client.post(self.url, {"username": "reader"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["email"], ["Email is required."])
        self.assertEqual(response.data["password"], ["Password is required."])

    def test_invalid_username_characters_are_rejected(self):
        response = self.client.post(self.url, self.payload(username="bad name!"))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_integrity_error_rolls_back_and_returns_400(self):
        with patch.object(User.objects, "create_user", side_effect=IntegrityError):
            response = self.client.post(self.url, self.payload())

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)
        self.assertEqual(User.objects.count(), 0)
