from rest_framework.test import APITestCase

from library.models import Book, Bookcase, Copy, Shelf
from library.tests.base import LibraryTestMixin


class AddBookManuallyTests(LibraryTestMixin, APITestCase):
    url = "/api/copies/"

    def setUp(self):
        super().setUp()
        self.bookcase = Bookcase.objects.create(owner=self.owner, name="Living room")
        self.shelf = Shelf.objects.create(bookcase=self.bookcase, name="Top")
        other_case = Bookcase.objects.create(owner=self.other, name="Study")
        self.other_shelf = Shelf.objects.create(bookcase=other_case, name="Top")

    def post(self, **extra):
        data = {"title": "Dune", "author": "Frank Herbert", **extra}
        return self.client.post(self.url, data, format="json")

    def test_title_and_author_only(self):
        response = self.post()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Book.objects.count(), 1)
        self.assertEqual(Copy.objects.count(), 1)
        self.assertEqual(Book.objects.get().created_by, self.owner)
        self.assertEqual(Copy.objects.get().owner, self.owner)

    def test_empty_title_rejected(self):
        response = self.post(title="")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Book.objects.count(), 0)
        self.assertEqual(Copy.objects.count(), 0)

    def test_optional_fields_empty(self):
        self.post()
        book = Book.objects.get()
        self.assertIsNone(book.isbn)
        self.assertEqual(book.publisher, "")
        self.assertEqual(book.cover, "")

    def test_no_shelf_is_unshelved(self):
        self.post()
        self.assertIsNone(Copy.objects.get().shelf)

    def test_own_shelf(self):
        self.post(shelf=self.shelf.id)
        self.assertEqual(Copy.objects.get().shelf_id, self.shelf.id)

    def test_foreign_shelf_rejected_and_nothing_saved(self):
        response = self.post(shelf=self.other_shelf.id)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Book.objects.count(), 0)
        self.assertEqual(Copy.objects.count(), 0)

    def test_other_user_cannot_retrieve_copy(self):
        copy_id = self.post().data["id"]
        self.client.force_authenticate(self.other)
        response = self.client.get(f"{self.url}{copy_id}/")
        self.assertEqual(response.status_code, 404)

    def test_hyphenated_isbn_saved_without_hyphens(self):
        self.post(isbn="978-0-306-40615-7")
        self.assertEqual(Book.objects.get().isbn, "9780306406157")

    def test_short_isbn_rejected(self):
        response = self.post(isbn="12345")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Book.objects.count(), 0)

    def test_anonymous_gets_401(self):
        self.client.force_authenticate(None)
        response = self.post()
        self.assertEqual(response.status_code, 401)

    def test_deleting_user_removes_manual_book_and_copy(self):
        self.post()
        self.owner.delete()
        self.assertEqual(Book.objects.count(), 0)
        self.assertEqual(Copy.objects.count(), 0)
