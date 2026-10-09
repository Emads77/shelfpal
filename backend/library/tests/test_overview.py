from rest_framework import status
from rest_framework.test import APITestCase

from library.models import Bookcase, Shelf
from library.services import PREVIEW_LIMIT
from library.tests.base import LibraryTestMixin, make_copy


class LibraryOverviewApiTests(LibraryTestMixin, APITestCase):
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
