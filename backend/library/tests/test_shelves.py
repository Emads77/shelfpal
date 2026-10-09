from rest_framework import status
from rest_framework.test import APITestCase

from library.models import Book, Bookcase, Copy, Shelf
from library.tests.base import LibraryTestMixin


class ShelfApiTests(LibraryTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.bookcase = Bookcase.objects.create(owner=self.owner, name="Living room")
        self.other_bookcase = Bookcase.objects.create(owner=self.other, name="Office")

    def test_create_shelf_in_my_bookcase(self):
        response = self.client.post(
            f"/api/bookcases/{self.bookcase.id}/shelves/", {"name": "Top"}
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
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
        response = self.client.get(f"/api/bookcases/{self.other_bookcase.id}/shelves/")

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


class ShelfBulkCreateApiTests(LibraryTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.bookcase = Bookcase.objects.create(owner=self.owner, name="A")
        self.other_bookcase = Bookcase.objects.create(owner=self.other, name="Office")
        self.url = f"/api/bookcases/{self.bookcase.id}/shelves/bulk/"

    def post(self, names, url=None):
        return self.client.post(url or self.url, {"names": names}, format="json")

    def test_creates_all_shelves_in_order(self):
        response = self.post(["A1", "A2", "A3"])

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual([s["name"] for s in response.data], ["A1", "A2", "A3"])
        stored = list(self.bookcase.shelves.values_list("name", flat=True))
        self.assertEqual(stored, ["A1", "A2", "A3"])

    def test_names_are_trimmed(self):
        response = self.post(["  A1  "])

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data[0]["name"], "A1")

    def test_duplicate_names_in_the_request_are_rejected(self):
        response = self.post(["A1", "A1"])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("names", response.data)
        self.assertEqual(self.bookcase.shelves.count(), 0)

    def test_existing_name_rejects_the_whole_batch(self):
        Shelf.objects.create(bookcase=self.bookcase, name="A1")

        response = self.post(["A1", "A2"])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("names", response.data)
        self.assertEqual(
            list(self.bookcase.shelves.values_list("name", flat=True)), ["A1"]
        )

    def test_same_name_is_allowed_in_another_bookcase(self):
        other_own = Bookcase.objects.create(owner=self.owner, name="B")
        Shelf.objects.create(bookcase=other_own, name="1")

        response = self.post(["1"])

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_another_users_bookcase_returns_404(self):
        url = f"/api/bookcases/{self.other_bookcase.id}/shelves/bulk/"

        response = self.post(["A1"], url=url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.other_bookcase.shelves.count(), 0)

    def test_empty_list_is_rejected(self):
        response = self.post([])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("names", response.data)

    def test_blank_name_is_rejected(self):
        response = self.post(["A1", "   "])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.bookcase.shelves.count(), 0)

    def test_missing_names_field_is_rejected(self):
        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("names", response.data)

    def test_more_than_fifty_names_is_rejected(self):
        response = self.post([f"S{number}" for number in range(51)])

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.bookcase.shelves.count(), 0)

    def test_requires_authentication(self):
        self.client.force_authenticate(None)

        response = self.post(["A1"])

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
