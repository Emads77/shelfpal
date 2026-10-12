from rest_framework.test import APITestCase

from library.models import Book, Bookcase, Copy, Shelf
from library.tests.base import LibraryTestMixin

URL = "/api/copies/"


class AddBookByIdTests(LibraryTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.book = Book.objects.create(
            isbn="9780140328721", title="Fantastic Mr. Fox", author="Roald Dahl"
        )
        self.bookcase = Bookcase.objects.create(owner=self.owner, name="Living room")
        self.shelf = Shelf.objects.create(bookcase=self.bookcase, name="Top")

    def test_adds_copy_on_own_shelf(self):
        response = self.client.post(URL, {"book": self.book.id, "shelf": self.shelf.id})

        self.assertEqual(response.status_code, 201)
        copy = Copy.objects.get()
        self.assertEqual(copy.owner, self.owner)
        self.assertEqual(copy.book, self.book)
        self.assertEqual(copy.shelf, self.shelf)
        self.assertEqual(response.data["location"]["shelf_id"], self.shelf.id)

    def test_no_shelf_means_unassigned(self):
        response = self.client.post(URL, {"book": self.book.id})

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(Copy.objects.get().shelf)
        self.assertIsNone(response.data["location"])

    def test_null_shelf_means_unassigned(self):
        response = self.client.post(
            URL, {"book": self.book.id, "shelf": None}, format="json"
        )

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(Copy.objects.get().shelf)

    def test_foreign_shelf_returns_404_and_saves_nothing(self):
        other_case = Bookcase.objects.create(owner=self.other, name="Theirs")
        other_shelf = Shelf.objects.create(bookcase=other_case, name="Shelf")

        response = self.client.post(
            URL, {"book": self.book.id, "shelf": other_shelf.id}
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(Copy.objects.count(), 0)

    def test_another_users_private_book_returns_404(self):
        private = Book.objects.create(
            title="Secret", author="Them", created_by=self.other
        )

        response = self.client.post(URL, {"book": private.id})

        self.assertEqual(response.status_code, 404)
        self.assertEqual(Copy.objects.count(), 0)

    def test_own_private_book_is_allowed(self):
        mine = Book.objects.create(title="Mine", author="Me", created_by=self.owner)

        response = self.client.post(URL, {"book": mine.id})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Copy.objects.count(), 1)

    def test_unknown_book_returns_404(self):
        response = self.client.post(URL, {"book": 99999})

        self.assertEqual(response.status_code, 404)
        self.assertEqual(Copy.objects.count(), 0)

    def test_same_book_twice_makes_two_copies(self):
        self.client.post(URL, {"book": self.book.id})
        self.client.post(URL, {"book": self.book.id})

        self.assertEqual(Copy.objects.count(), 2)
        self.assertEqual(Book.objects.count(), 1)

    def test_anonymous_returns_401(self):
        self.client.force_authenticate(None)

        response = self.client.post(URL, {"book": self.book.id})

        self.assertEqual(response.status_code, 401)
        self.assertEqual(Copy.objects.count(), 0)
