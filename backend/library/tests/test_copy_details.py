from rest_framework.test import APITestCase

from library.models import Book, Copy
from library.tests.base import LibraryTestMixin

DETAILS = {"is_signed": True, "edition_number": 42, "edition_size": 500}


class CopyDetailsTests(LibraryTestMixin, APITestCase):
    url = "/api/copies/"

    def setUp(self):
        super().setUp()
        self.shared_book = Book.objects.create(title="Dune", author="Frank Herbert")

    def add_manually(self, **extra):
        data = {"title": "Dune", "author": "Frank Herbert", **extra}
        return self.client.post(self.url, data, format="json")

    def add_from_book(self, **extra):
        data = {"book": self.shared_book.id, **extra}
        return self.client.post(self.url, data, format="json")

    def test_details_default_when_omitted(self):
        response = self.add_manually()
        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.data["is_signed"])
        self.assertIsNone(response.data["edition_number"])
        self.assertIsNone(response.data["edition_size"])

    def test_manual_book_saves_details(self):
        response = self.add_manually(**DETAILS)
        self.assertEqual(response.status_code, 201)
        copy = Copy.objects.get()
        self.assertTrue(copy.is_signed)
        self.assertEqual(copy.edition_number, 42)
        self.assertEqual(copy.edition_size, 500)
        self.assertEqual(response.data["edition_number"], 42)

    def test_scanned_book_saves_details(self):
        response = self.add_from_book(**DETAILS)
        self.assertEqual(response.status_code, 201)
        copy = Copy.objects.get()
        self.assertTrue(copy.is_signed)
        self.assertEqual(copy.edition_number, 42)
        self.assertEqual(copy.edition_size, 500)

    def test_number_without_size_is_allowed(self):
        response = self.add_manually(edition_number=7)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Copy.objects.get().edition_number, 7)
        self.assertIsNone(Copy.objects.get().edition_size)

    def test_size_without_number_rejected(self):
        response = self.add_manually(edition_size=500)
        self.assertEqual(response.status_code, 400)
        self.assertIn("edition_number", response.data)
        self.assertEqual(Book.objects.filter(created_by=self.owner).count(), 0)
        self.assertEqual(Copy.objects.count(), 0)

    def test_number_above_size_rejected(self):
        response = self.add_manually(edition_number=501, edition_size=500)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Copy.objects.count(), 0)

    def test_number_zero_rejected(self):
        response = self.add_manually(edition_number=0)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Copy.objects.count(), 0)

    def test_invalid_details_rejected_when_adding_scanned_book(self):
        response = self.add_from_book(edition_size=5)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Copy.objects.count(), 0)

    def test_other_user_does_not_see_my_details(self):
        self.add_from_book(**DETAILS)

        self.client.force_authenticate(self.other)
        response = self.add_from_book()
        self.assertFalse(response.data["is_signed"])
        self.assertIsNone(response.data["edition_number"])

        listing = self.client.get(self.url)
        self.assertEqual(len(listing.data), 1)
        self.assertFalse(listing.data[0]["is_signed"])
        self.assertIsNone(listing.data[0]["edition_number"])

        mine = Copy.objects.get(owner=self.owner)
        self.assertEqual(mine.edition_number, 42)
