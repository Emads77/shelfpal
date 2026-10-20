from django.contrib.auth import get_user_model

from library.models import Book, Copy

User = get_user_model()

PASSWORD = "Sax10n-Advanc3dD3v-2026!"


def make_copy(owner, shelf, title, cover=""):
    book = Book.objects.create(title=title, author="Anon", cover=cover)
    return Copy.objects.create(owner=owner, book=book, shelf=shelf)


class LibraryTestMixin:
    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user(
            username="owner", email="owner@example.com", password=PASSWORD
        )
        self.other = User.objects.create_user(
            username="other", email="other@example.com", password=PASSWORD
        )
        self.client.force_authenticate(self.owner)
