from unittest.mock import patch

from rest_framework.test import APITestCase

from library.external import ExternalLookupError
from library.models import Book
from library.tests.base import LibraryTestMixin

URL = "/api/books/lookup/"
ISBN = "9780140328721"
FETCHED = {
    "title": "Fantastic Mr. Fox",
    "author": "Roald Dahl",
    "publisher": "Puffin",
    "cover": "https://covers.openlibrary.org/b/id/15152634-M.jpg",
}


class BookLookupViewTests(LibraryTestMixin, APITestCase):
    @patch("library.services.fetch_by_isbn")
    def test_returns_fetched_book(self, mock_fetch):
        mock_fetch.return_value = FETCHED

        response = self.client.get(URL, {"isbn": ISBN})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "Fantastic Mr. Fox")
        self.assertEqual(Book.objects.count(), 1)

    @patch("library.services.fetch_by_isbn")
    def test_unknown_isbn_returns_404(self, mock_fetch):
        mock_fetch.return_value = None

        response = self.client.get(URL, {"isbn": ISBN})

        self.assertEqual(response.status_code, 404)
        self.assertEqual(Book.objects.count(), 0)

    @patch("library.services.fetch_by_isbn")
    def test_open_library_down_returns_503(self, mock_fetch):
        mock_fetch.side_effect = ExternalLookupError("down")

        response = self.client.get(URL, {"isbn": ISBN})

        self.assertEqual(response.status_code, 503)
        self.assertEqual(Book.objects.count(), 0)

    @patch("library.services.fetch_by_isbn")
    def test_missing_isbn_returns_400(self, mock_fetch):
        response = self.client.get(URL)

        self.assertEqual(response.status_code, 400)
        mock_fetch.assert_not_called()

    @patch("library.services.fetch_by_isbn")
    def test_wrong_length_isbn_returns_400(self, mock_fetch):
        response = self.client.get(URL, {"isbn": "123"})

        self.assertEqual(response.status_code, 400)
        mock_fetch.assert_not_called()

    @patch("library.services.fetch_by_isbn")
    def test_anonymous_returns_401(self, mock_fetch):
        self.client.force_authenticate(None)

        response = self.client.get(URL, {"isbn": ISBN})

        self.assertEqual(response.status_code, 401)
        mock_fetch.assert_not_called()
