from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from library.models import Book, Bookcase, Copy, Shelf

User = get_user_model()

PASSWORD = "Sax10n-Advanc3dD3v-2026!"


class BookcaseApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner", email="owner@example.com", password=PASSWORD
        )
        self.other = User.objects.create_user(
            username="other", email="other@example.com", password=PASSWORD
        )
        self.client.force_authenticate(self.owner)

        self.bookcase = Bookcase.objects.create(
            owner=self.owner, name="Living room")
        self.other_bookcase = Bookcase.objects.create(
            owner=self.other, name="Office")

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
        print("the bookcases before creating in the test",self.client.get("/api/bookcases/").data)
        Bookcase.objects.create(owner=self.owner, name="Hallway")
        print("the bookcases after creating in the test",self.client.get("/api/bookcases/").data)
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


class ShelfApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner", email="owner@example.com", password=PASSWORD
        )
        self.other = User.objects.create_user(
            username="other", email="other@example.com", password=PASSWORD
        )
        self.client.force_authenticate(self.owner)

        self.bookcase = Bookcase.objects.create(
            owner=self.owner, name="Living room")
        self.other_bookcase = Bookcase.objects.create(
            owner=self.other, name="Office")

    def test_create_shelf_in_my_bookcase(self):
        response = self.client.post(
            f"/api/bookcases/{self.bookcase.id}/shelves/", {"name": "Top"}
        )
        print("the failling test ------ > ", response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED,response.data)  # fail
        self.assertEqual(response.data["name"], "Top")
        self.assertTrue(Shelf.objects.filter(bookcase=self.bookcase).exists())

    def test_duplicate_shelf_name_in_same_bookcase_is_rejected(self):
        Shelf.objects.create(bookcase=self.bookcase, name="Top")

        response = self.client.post(
            f"/api/bookcases/{self.bookcase.id}/shelves/", {"name": "Top"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_shelves_of_another_users_bookcase_return_404(self):
        response = self.client.get(
            f"/api/bookcases/{self.other_bookcase.id}/shelves/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deleting_a_shelf_unshelves_its_copies(self):
        shelf = Shelf.objects.create(bookcase=self.bookcase, name="Top")
        book = Book.objects.create(title="Dune", author="Frank Herbert")
        copy = Copy.objects.create(owner=self.owner, book=book, shelf=shelf)

        response = self.client.delete(
            f"/api/bookcases/{self.bookcase.id}/shelves/{shelf.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        copy.refresh_from_db()
        self.assertIsNone(copy.shelf)

    def test_deleting_a_bookcase_unshelves_its_copies(self):
        shelf = Shelf.objects.create(bookcase=self.bookcase, name="Top")
        book = Book.objects.create(title="Dune", author="Frank Herbert")
        copy = Copy.objects.create(owner=self.owner, book=book, shelf=shelf)

        response = self.client.delete(f"/api/bookcases/{self.bookcase.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        copy.refresh_from_db()
        self.assertIsNone(copy.shelf)
        self.assertFalse(Shelf.objects.filter(id=shelf.id).exists())
