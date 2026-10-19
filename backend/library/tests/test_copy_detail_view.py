from rest_framework.test import APITestCase

from library.models import Book, Bookcase, Copy, Shelf
from library.tests.base import LibraryTestMixin

DETAILS = {"is_signed": True, "edition_number": 42, "edition_size": 500}


class CopyDetailViewTests(LibraryTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.book = Book.objects.create(
            title="Dune",
            author="Frank Herbert",
            isbn="9780441013593",
            publisher="Ace",
        )
        bookcase = Bookcase.objects.create(owner=self.owner, name="Den")
        self.shelf = Shelf.objects.create(bookcase=bookcase, name="Top")
        self.copy = Copy.objects.create(
            owner=self.owner, book=self.book, shelf=self.shelf, **DETAILS
        )

    def url(self, copy_id=None):
        return f"/api/copies/{copy_id or self.copy.id}/"

    def test_detail_returns_book_edition_and_location(self):
        response = self.client.get(self.url())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["book"]["isbn"], "9780441013593")
        self.assertEqual(response.data["book"]["publisher"], "Ace")
        self.assertTrue(response.data["is_signed"])
        self.assertEqual(response.data["edition_number"], 42)
        self.assertEqual(response.data["edition_size"], 500)
        self.assertEqual(response.data["location"]["shelf_name"], "Top")
        self.assertEqual(response.data["location"]["bookcase_name"], "Den")

    def test_detail_without_shelf_has_no_location(self):
        copy = Copy.objects.create(owner=self.owner, book=self.book)
        response = self.client.get(self.url(copy.id))
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["location"])

    def test_detail_loads_in_a_single_query(self):
        with self.assertNumQueries(1):
            self.client.get(self.url())

    def test_other_user_cannot_open_my_copy(self):
        self.client.force_authenticate(self.other)
        response = self.client.get(self.url())
        self.assertEqual(response.status_code, 404)

    def test_unknown_copy_returns_404(self):
        response = self.client.get(self.url(999999))
        self.assertEqual(response.status_code, 404)

    def test_list_stays_light(self):
        response = self.client.get("/api/copies/")
        self.assertEqual(response.status_code, 200)
        book = response.data[0]["book"]
        self.assertNotIn("isbn", book)
        self.assertNotIn("publisher", book)
