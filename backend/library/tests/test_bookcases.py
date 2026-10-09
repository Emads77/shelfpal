from rest_framework import status
from rest_framework.test import APITestCase

from library.models import Bookcase
from library.tests.base import LibraryTestMixin


class BookcaseApiTests(LibraryTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.bookcase = Bookcase.objects.create(owner=self.owner, name="Living room")
        self.other_bookcase = Bookcase.objects.create(owner=self.other, name="Office")

    def test_create_bookcase(self):
        response = self.client.post("/api/bookcases/", {"name": "Hallway"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Hallway")
        self.assertTrue(
            Bookcase.objects.filter(owner=self.owner, name="Hallway").exists()
        )

    def test_duplicate_bookcase_name_is_rejected(self):
        response = self.client.post("/api/bookcases/", {"name": "Living room"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)
        self.assertEqual(Bookcase.objects.filter(owner=self.owner).count(), 1)

    def test_same_name_is_allowed_for_a_different_user(self):
        self.client.force_authenticate(self.other)

        response = self.client.post("/api/bookcases/", {"name": "Living room"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_rename_to_an_existing_name_is_rejected(self):
        Bookcase.objects.create(owner=self.owner, name="Hallway")
        response = self.client.patch(
            f"/api/bookcases/{self.bookcase.id}/", {"name": "Hallway"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.bookcase.refresh_from_db()
        self.assertEqual(self.bookcase.name, "Living room")

    def test_list_shows_only_my_bookcases(self):
        response = self.client.get("/api/bookcases/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item["name"] for item in response.data]
        self.assertEqual(names, ["Living room"])

    def test_another_users_bookcase_is_not_reachable(self):
        response = self.client.get(f"/api/bookcases/{self.other_bookcase.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
