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


class SessionTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="reader", email="reader@examplemail.com", password=STRONG_PASSWORD
        )

    def login(self, email="reader@examplemail.com", password=STRONG_PASSWORD):
        return self.client.post(
            reverse("login"), {"email": email, "password": password}
        )

    def post_refresh(self, token):
        return self.client.post(reverse("refresh"), {"refresh": token})

    def post_logout(self, token):
        return self.client.post(reverse("logout"), {"refresh": token})


class LoginViewTests(SessionTestCase):
    def test_valid_login_returns_access_and_refresh_tokens(self):
        response = self.login()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data), {"access", "refresh"})

    def test_wrong_password_and_unknown_email_give_identical_error(self):
        wrong_password = self.login(password="wrong-password")
        unknown_email = self.login(email="unknown@examplemail.com")

        self.assertEqual(wrong_password.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(unknown_email.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(wrong_password.data, unknown_email.data)

    def test_missing_fields_are_rejected(self):
        response = self.client.post(
            reverse("login"), {"email": "reader@examplemail.com"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)


class MeViewTests(SessionTestCase):
    def test_requires_a_token(self):
        response = self.client.get(reverse("me"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_the_logged_in_user(self):
        access = self.login().data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.get(reverse("me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data), {"id", "username", "email"})
        self.assertEqual(response.data["email"], "reader@examplemail.com")

    def test_rejects_a_garbage_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer im-a-fake-token")

        response = self.client.get(reverse("me"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RefreshViewTests(SessionTestCase):
    def test_refresh_returns_new_access_and_rotated_refresh_token(self):
        old_refresh = self.login().data["refresh"]

        response = self.post_refresh(old_refresh)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertNotEqual(response.data["refresh"], old_refresh)

    def test_rotated_out_refresh_token_cannot_be_reused(self):
        old_refresh = self.login().data["refresh"]
        self.post_refresh(old_refresh)

        response = self.post_refresh(old_refresh)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_refresh_token_is_rejected(self):
        response = self.post_refresh("im-a-fake-token")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutViewTests(SessionTestCase):
    def test_logout_blacklists_the_refresh_token(self):
        refresh = self.login().data["refresh"]

        response = self.post_logout(refresh)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(
            self.post_refresh(refresh).status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_logout_with_an_invalid_token_still_succeeds(self):
        response = self.post_logout("im-a-fake-token")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_logout_without_a_token_still_succeeds(self):
        response = self.client.post(reverse("logout"), {})

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_access_token_stays_valid_until_it_expires(self):
        tokens = self.login().data
        self.post_logout(tokens["refresh"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        response = self.client.get(reverse("me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
