from rest_framework.test import APITestCase

from library.models import Book, Copy
from library.tests.base import LibraryTestMixin, make_copy


class CopyUpdateTests(LibraryTestMixin, APITestCase):
    def patch(self, copy, **data):
        return self.client.patch(f"/api/copies/{copy.id}/", data, format="json")

    def make_personal_copy(self, title="Mine"):
        book = Book.objects.create(title=title, author="Me", created_by=self.owner)
        return Copy.objects.create(owner=self.owner, book=book)

    # --- copy-only edits ---

    def test_invalid_status_is_rejected(self):
        copy = make_copy(self.owner, None, "Shared")

        response = self.patch(copy, status="abandoned")

        self.assertEqual(response.status_code, 400)
        self.assertIn("status", response.data)

    def test_copy_details_never_clone_the_book(self):
        copy = make_copy(self.owner, None, "Shared")
        book_id = copy.book_id

        response = self.patch(copy, is_signed=True, edition_number=3, edition_size=100)

        self.assertEqual(response.status_code, 200)
        copy.refresh_from_db()
        self.assertEqual(copy.book_id, book_id)
        self.assertTrue(copy.is_signed)
        self.assertEqual(copy.edition_number, 3)
        self.assertEqual(Book.objects.count(), 1)

    # --- book edits: in place ---

    def test_own_book_with_one_copy_is_edited_in_place(self):
        copy = self.make_personal_copy()
        book_id = copy.book_id

        response = self.patch(copy, title="Better title", publisher="Illumicrate")

        self.assertEqual(response.status_code, 200)
        copy.refresh_from_db()
        self.assertEqual(copy.book_id, book_id)
        self.assertEqual(copy.book.title, "Better title")
        self.assertEqual(copy.book.publisher, "Illumicrate")
        self.assertEqual(Book.objects.count(), 1)

    # --- book edits: copy on edit ---

    def test_editing_a_shared_book_clones_it_for_this_copy_only(self):
        copy = make_copy(self.owner, None, "Shared")
        original = copy.book
        other_copy = Copy.objects.create(owner=self.other, book=original)

        response = self.patch(copy, publisher="Illumicrate")

        self.assertEqual(response.status_code, 200)
        copy.refresh_from_db()
        clone = copy.book
        self.assertNotEqual(clone.id, original.id)
        self.assertEqual(clone.created_by, self.owner)
        self.assertEqual(clone.copied_from, original)
        self.assertEqual(clone.publisher, "Illumicrate")
        self.assertEqual(clone.title, "Shared")
        self.assertEqual(clone.author, "Anon")
        self.assertEqual(response.data["book"]["id"], clone.id)

        original.refresh_from_db()
        self.assertEqual(original.publisher, "")
        other_copy.refresh_from_db()
        self.assertEqual(other_copy.book_id, original.id)

    def test_own_book_with_other_copies_is_cloned(self):
        copy = self.make_personal_copy()
        sibling = Copy.objects.create(owner=self.owner, book=copy.book)
        original = copy.book

        self.patch(copy, publisher="Waterstones")

        copy.refresh_from_db()
        sibling.refresh_from_db()
        self.assertNotEqual(copy.book_id, original.id)
        self.assertEqual(copy.book.publisher, "Waterstones")
        self.assertEqual(sibling.book_id, original.id)
        self.assertEqual(sibling.book.publisher, "")
        self.assertIsNone(copy.book.copied_from)

    def test_clone_of_a_clone_still_points_to_the_catalogue_book(self):
        copy = make_copy(self.owner, None, "Shared")
        catalogue = copy.book
        self.patch(copy, title="First edit")
        copy.refresh_from_db()
        Copy.objects.create(owner=self.owner, book=copy.book)

        self.patch(copy, title="Second edit")

        copy.refresh_from_db()
        self.assertEqual(copy.book.title, "Second edit")
        self.assertEqual(copy.book.copied_from, catalogue)

    def test_editing_a_clone_again_stays_in_place(self):
        copy = make_copy(self.owner, None, "Shared")
        self.patch(copy, title="First edit")
        copy.refresh_from_db()
        clone_id = copy.book_id
        books_before = Book.objects.count()

        self.patch(copy, title="Second edit")

        copy.refresh_from_db()
        self.assertEqual(copy.book_id, clone_id)
        self.assertEqual(Book.objects.count(), books_before)

    def test_unchanged_book_fields_do_not_clone(self):
        copy = make_copy(self.owner, None, "Shared")
        book_id = copy.book_id

        response = self.patch(copy, title="Shared", author="Anon")

        self.assertEqual(response.status_code, 200)
        copy.refresh_from_db()
        self.assertEqual(copy.book_id, book_id)
        self.assertEqual(Book.objects.count(), 1)

    # --- isbn ---

    def test_isbn_is_normalized(self):
        copy = self.make_personal_copy()

        self.patch(copy, isbn="978-0-306-40615-7")

        copy.book.refresh_from_db()
        self.assertEqual(copy.book.isbn, "9780306406157")

    def test_blank_isbn_is_cleared(self):
        copy = self.make_personal_copy()
        copy.book.isbn = "9780306406157"
        copy.book.save()

        self.patch(copy, isbn="")

        copy.book.refresh_from_db()
        self.assertIsNone(copy.book.isbn)

    def test_invalid_isbn_is_rejected(self):
        copy = self.make_personal_copy()

        response = self.patch(copy, isbn="123")

        self.assertEqual(response.status_code, 400)
        self.assertIn("isbn", response.data)

    # --- validation ---

    def test_edition_number_cannot_exceed_stored_size(self):
        copy = make_copy(self.owner, None, "Shared")
        copy.edition_number = 5
        copy.edition_size = 10
        copy.save()

        response = self.patch(copy, edition_size=3)

        self.assertEqual(response.status_code, 400)
        self.assertIn("edition_number", response.data)

    def test_edition_size_without_a_number_is_rejected(self):
        copy = make_copy(self.owner, None, "Shared")

        response = self.patch(copy, edition_size=100)

        self.assertEqual(response.status_code, 400)
        self.assertIn("edition_number", response.data)

    def test_empty_body_is_rejected(self):
        copy = make_copy(self.owner, None, "Shared")

        response = self.patch(copy)

        self.assertEqual(response.status_code, 400)

    def test_blank_title_is_rejected(self):
        copy = self.make_personal_copy()

        response = self.patch(copy, title="")

        self.assertEqual(response.status_code, 400)
        self.assertIn("title", response.data)

    # --- ownership ---

    def test_other_users_copy_is_not_found(self):
        copy = make_copy(self.other, None, "Theirs")

        response = self.patch(copy, title="Hacked")

        self.assertEqual(response.status_code, 404)
        copy.book.refresh_from_db()
        self.assertEqual(copy.book.title, "Theirs")
