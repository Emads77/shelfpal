from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from library.models import Book, Bookcase, Copy, Shelf
from library.services import PREVIEW_LIMIT

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

        self.bookcase = Bookcase.objects.create(owner=self.owner, name="Living room")
        self.other_bookcase = Bookcase.objects.create(owner=self.other, name="Office")

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
        Bookcase.objects.create(owner=self.owner, name="Hallway")
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


def make_copy(owner, shelf, title, cover=""):
    book = Book.objects.create(title=title, author="Anon", cover=cover)
    return Copy.objects.create(owner=owner, book=book, shelf=shelf)


class LibraryOverviewApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner", email="owner@example.com", password=PASSWORD
        )
        self.other = User.objects.create_user(
            username="other", email="other@example.com", password=PASSWORD
        )
        self.client.force_authenticate(self.owner)

    def test_requires_authentication(self):
        self.client.force_authenticate(None)

        response = self.client.get("/api/overview/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_library(self):
        response = self.client.get("/api/overview/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bookcases"], [])
        self.assertEqual(response.data["unassigned_count"], 0)

    def test_counts_per_shelf_and_bookcase(self):
        bookcase = Bookcase.objects.create(owner=self.owner, name="Living room")
        top = Shelf.objects.create(bookcase=bookcase, name="Top")
        Shelf.objects.create(bookcase=bookcase, name="Bottom")
        make_copy(self.owner, top, "Dune")
        make_copy(self.owner, top, "Emma")

        response = self.client.get("/api/overview/")

        item = response.data["bookcases"][0]
        self.assertEqual(item["name"], "Living room")
        self.assertEqual(item["shelf_count"], 2)
        self.assertEqual(item["book_count"], 2)
        counts = {shelf["name"]: shelf["book_count"] for shelf in item["shelves"]}
        self.assertEqual(counts, {"Top": 2, "Bottom": 0})

    def test_previews_are_capped_and_newest_first(self):
        bookcase = Bookcase.objects.create(owner=self.owner, name="Living room")
        shelf = Shelf.objects.create(bookcase=bookcase, name="Top")
        total = PREVIEW_LIMIT + 2
        for number in range(total):
            make_copy(self.owner, shelf, f"Book {number}")

        response = self.client.get("/api/overview/")

        shelf_data = response.data["bookcases"][0]["shelves"][0]
        self.assertEqual(shelf_data["book_count"], total)
        previews = shelf_data["preview_covers"]
        self.assertEqual(len(previews), PREVIEW_LIMIT)
        self.assertEqual(previews[0]["title"], f"Book {total - 1}")

    def test_preview_passes_the_cover_through(self):
        bookcase = Bookcase.objects.create(owner=self.owner, name="Living room")
        shelf = Shelf.objects.create(bookcase=bookcase, name="Top")
        make_copy(self.owner, shelf, "With cover", cover="https://example.com/a.jpg")
        make_copy(self.owner, shelf, "Without cover")

        response = self.client.get("/api/overview/")

        covers = {
            preview["title"]: preview["cover"]
            for preview in response.data["bookcases"][0]["shelves"][0]["preview_covers"]
        }
        self.assertEqual(covers["With cover"], "https://example.com/a.jpg")
        self.assertEqual(covers["Without cover"], "")

    def test_unassigned_count_only_counts_my_unshelved_copies(self):
        bookcase = Bookcase.objects.create(owner=self.owner, name="Living room")
        shelf = Shelf.objects.create(bookcase=bookcase, name="Top")
        make_copy(self.owner, shelf, "Shelved")
        make_copy(self.owner, None, "Loose 1")
        make_copy(self.owner, None, "Loose 2")
        make_copy(self.other, None, "Someone else's")

        response = self.client.get("/api/overview/")

        self.assertEqual(response.data["unassigned_count"], 2)

    def test_other_users_data_is_not_included(self):
        other_bookcase = Bookcase.objects.create(owner=self.other, name="Office")
        other_shelf = Shelf.objects.create(bookcase=other_bookcase, name="Desk")
        make_copy(self.other, other_shelf, "Private")

        response = self.client.get("/api/overview/")

        self.assertEqual(response.data["bookcases"], [])

    def test_bookcases_and_shelves_are_in_creation_order(self):
        second = Bookcase.objects.create(owner=self.owner, name="B")
        first = Bookcase.objects.create(owner=self.owner, name="A")
        Shelf.objects.create(bookcase=second, name="2")
        Shelf.objects.create(bookcase=second, name="1")

        response = self.client.get("/api/overview/")

        names = [item["name"] for item in response.data["bookcases"]]
        self.assertEqual(names, ["B", "A"])
        shelf_names = [s["name"] for s in response.data["bookcases"][0]["shelves"]]
        self.assertEqual(shelf_names, ["2", "1"])
        self.assertEqual(first.name, "A")


class ShelfBulkCreateApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner", email="owner@example.com", password=PASSWORD
        )
        self.other = User.objects.create_user(
            username="other", email="other@example.com", password=PASSWORD
        )
        self.client.force_authenticate(self.owner)

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


class CopyApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner", email="owner@example.com", password=PASSWORD
        )
        self.other = User.objects.create_user(
            username="other", email="other@example.com", password=PASSWORD
        )
        self.client.force_authenticate(self.owner)

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
