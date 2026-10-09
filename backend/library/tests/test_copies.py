from rest_framework import status
from rest_framework.test import APITestCase

from library.models import Book, Bookcase, Copy, Shelf
from library.tests.base import LibraryTestMixin, make_copy


class CopyApiTests(LibraryTestMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.bookcase = Bookcase.objects.create(owner=self.owner, name="Living room")
        self.top = Shelf.objects.create(bookcase=self.bookcase, name="Top")
        self.bottom = Shelf.objects.create(bookcase=self.bookcase, name="Bottom")
        other_bookcase = Bookcase.objects.create(owner=self.other, name="Office")
        self.other_shelf = Shelf.objects.create(bookcase=other_bookcase, name="Desk")

        self.first = make_copy(self.owner, self.top, "First")
        self.second = make_copy(self.owner, self.top, "Second")
        self.third = make_copy(self.owner, self.bottom, "Third")
        self.loose = make_copy(self.owner, None, "Loose")
        self.foreign = make_copy(self.other, self.other_shelf, "Foreign")

    def post(self, path, data):
        return self.client.post(path, data, format="json")

    # Listing

    def test_requires_authentication(self):
        self.client.force_authenticate(None)

        response = self.client.get("/api/copies/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_only_my_copies(self):
        response = self.client.get("/api/copies/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item["id"] for item in response.data}
        self.assertEqual(
            ids, {self.first.id, self.second.id, self.third.id, self.loose.id}
        )

    def test_list_by_shelf_is_newest_first_with_book_details(self):
        response = self.client.get(f"/api/copies/?shelf={self.top.id}")

        self.assertEqual(
            [c["id"] for c in response.data], [self.second.id, self.first.id]
        )
        self.assertEqual(response.data[0]["book"]["title"], "Second")
        self.assertEqual(response.data[0]["shelf"], self.top.id)
        self.assertFalse(response.data[0]["is_read"])

    def test_list_unassigned(self):
        response = self.client.get("/api/copies/?unassigned=true")

        self.assertEqual([c["id"] for c in response.data], [self.loose.id])

    def test_shelf_and_unassigned_together_are_rejected(self):
        response = self.client.get(f"/api/copies/?shelf={self.top.id}&unassigned=true")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_shelf_parameter_is_rejected(self):
        response = self.client.get("/api/copies/?shelf=abc")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_listing_another_users_shelf_returns_404(self):
        response = self.client.get(f"/api/copies/?shelf={self.other_shelf.id}")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # Updating

    def test_mark_a_copy_as_read(self):
        response = self.client.patch(
            f"/api/copies/{self.first.id}/", {"is_read": True}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_read"])
        self.first.refresh_from_db()
        self.assertTrue(self.first.is_read)

    def test_updating_another_users_copy_returns_404(self):
        response = self.client.patch(
            f"/api/copies/{self.foreign.id}/", {"is_read": True}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_without_is_read_is_rejected(self):
        response = self.client.patch(f"/api/copies/{self.first.id}/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Moving

    def test_move_copies_to_a_shelf(self):
        response = self.post(
            "/api/copies/move/",
            {"ids": [self.first.id, self.third.id], "shelf": self.bottom.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.first.refresh_from_db()
        self.assertEqual(self.first.shelf, self.bottom)

    def test_move_copies_to_unassigned(self):
        response = self.post(
            "/api/copies/move/", {"ids": [self.first.id], "shelf": None}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.first.refresh_from_db()
        self.assertIsNone(self.first.shelf)

    def test_duplicate_ids_are_counted_once(self):
        response = self.post(
            "/api/copies/move/",
            {"ids": [self.first.id, self.first.id], "shelf": self.bottom.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_move_with_another_users_copy_changes_nothing(self):
        response = self.post(
            "/api/copies/move/",
            {"ids": [self.first.id, self.foreign.id], "shelf": self.bottom.id},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ids", response.data)
        self.first.refresh_from_db()
        self.assertEqual(self.first.shelf, self.top)

    def test_move_with_an_unknown_id_is_rejected(self):
        response = self.post(
            "/api/copies/move/", {"ids": [999999], "shelf": self.bottom.id}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_move_into_another_users_shelf_returns_404(self):
        response = self.post(
            "/api/copies/move/",
            {"ids": [self.first.id], "shelf": self.other_shelf.id},
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.first.refresh_from_db()
        self.assertEqual(self.first.shelf, self.top)

    def test_move_requires_ids_and_a_shelf_value(self):
        no_ids = self.post("/api/copies/move/", {"ids": [], "shelf": None})
        no_shelf = self.post("/api/copies/move/", {"ids": [self.first.id]})

        self.assertEqual(no_ids.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(no_shelf.status_code, status.HTTP_400_BAD_REQUEST)

    def test_move_accepts_at_most_200_ids(self):
        response = self.post(
            "/api/copies/move/", {"ids": list(range(1, 202)), "shelf": None}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Deleting

    def test_delete_copies_keeps_the_books(self):
        book_id = self.first.book_id

        response = self.post(
            "/api/copies/delete/", {"ids": [self.first.id, self.second.id]}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertFalse(Copy.objects.filter(id=self.first.id).exists())
        self.assertTrue(Book.objects.filter(id=book_id).exists())

    def test_delete_with_another_users_copy_deletes_nothing(self):
        response = self.post(
            "/api/copies/delete/", {"ids": [self.first.id, self.foreign.id]}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Copy.objects.filter(id=self.first.id).exists())
        self.assertTrue(Copy.objects.filter(id=self.foreign.id).exists())

    def test_delete_requires_ids(self):
        response = self.post("/api/copies/delete/", {"ids": []})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
