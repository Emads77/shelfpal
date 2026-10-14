from unittest.mock import patch

from rest_framework.test import APITestCase

from library.external import ExternalLookupError
from library.models import Book
from library.services import get_or_fetch_book
from library.tests.base import LibraryTestMixin

ISBN = "9780140328721"
FETCHED = {
    "title": "Fantastic Mr. Fox",
    "author": "Roald Dahl",
    "publisher": "Puffin",
    "cover": "https://covers.openlibrary.org/b/id/15152634-M.jpg",
}


class GetOrFetchBookTests(LibraryTestMixin, APITestCase):
    @patch("library.services.fetch_by_isbn")
    def test_fetches_and_creates_shared_book(self, mock_fetch):
        mock_fetch.return_value = FETCHED

        book = get_or_fetch_book(ISBN)

        self.assertEqual(book.isbn, ISBN)
        self.assertEqual(book.title, "Fantastic Mr. Fox")
        self.assertIsNone(book.created_by)
        self.assertEqual(Book.objects.count(), 1)
        mock_fetch.assert_called_once_with(ISBN)

    @patch("library.services.fetch_by_isbn")
    def test_reuses_existing_shared_book(self, mock_fetch):
        existing = Book.objects.create(isbn=ISBN, title="Stored", author="A")

        book = get_or_fetch_book(ISBN)

        self.assertEqual(book.id, existing.id)
        self.assertEqual(Book.objects.count(), 1)
        mock_fetch.assert_not_called()

    @patch("library.services.fetch_by_isbn")
    def test_unknown_isbn_returns_none(self, mock_fetch):
        mock_fetch.return_value = None

        self.assertIsNone(get_or_fetch_book(ISBN))
        self.assertEqual(Book.objects.count(), 0)

    @patch("library.services.fetch_by_isbn")
    def test_open_library_down_raises(self, mock_fetch):
        mock_fetch.side_effect = ExternalLookupError("down")

        with self.assertRaises(ExternalLookupError):
            get_or_fetch_book(ISBN)
        self.assertEqual(Book.objects.count(), 0)

    @patch("library.services.fetch_by_isbn")
    def test_ignores_private_manual_book_with_same_isbn(self, mock_fetch):
        mock_fetch.return_value = FETCHED
        private = Book.objects.create(
            isbn=ISBN, title="Mine", author="Me", created_by=self.owner
        )

        book = get_or_fetch_book(ISBN)

        self.assertNotEqual(book.id, private.id)
        self.assertIsNone(book.created_by)
        self.assertEqual(Book.objects.count(), 2)
        mock_fetch.assert_called_once_with(ISBN)
