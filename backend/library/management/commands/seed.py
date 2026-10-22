"""Fill a database with a fixed set of test data.

Safe to run on every deploy: existing rows are reused, nothing is duplicated.
Refuses to run in production.
"""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from library.models import Book, Bookcase, Copy, Shelf

User = get_user_model()

SHARED_BOOKS = [
    {
        "isbn": "9780141439518",
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "publisher": "Penguin Classics",
    },
    {
        "isbn": "9780141439600",
        "title": "A Tale of Two Cities",
        "author": "Charles Dickens",
        "publisher": "Penguin Classics",
    },
    {
        "isbn": "9780141441146",
        "title": "Jane Eyre",
        "author": "Charlotte Bronte",
        "publisher": "Penguin Classics",
    },
    {
        "isbn": "9780141439570",
        "title": "The Picture of Dorian Gray",
        "author": "Oscar Wilde",
        "publisher": "Penguin Classics",
    },
]


def seed_user(email, username, password):
    user, _ = User.objects.get_or_create(email=email, defaults={"username": username})
    user.set_password(password)
    user.save(update_fields=["password"])
    return user


def get_shelf(owner, bookcase_name, shelf_name):
    bookcase, _ = Bookcase.objects.get_or_create(owner=owner, name=bookcase_name)
    shelf, _ = Shelf.objects.get_or_create(bookcase=bookcase, name=shelf_name)
    return shelf


def add_copy(owner, book, shelf=None, **fields):
    Copy.objects.get_or_create(
        owner=owner, book=book, defaults={"shelf": shelf, **fields}
    )


class Command(BaseCommand):
    help = "Create test users, bookcases, shelves, books and copies."

    def handle(self, *args, **options):
        if os.environ.get("DEPLOY_ENV") == "production":
            raise CommandError("Refusing to seed a production database.")

        password = os.environ.get("SEED_USER_PASSWORD")
        if not password:
            raise CommandError("Set SEED_USER_PASSWORD before seeding.")

        with transaction.atomic():
            collector = seed_user("collector@shelfpal.test", "collector", password)
            reader = seed_user("reader@shelfpal.test", "reader", password)

            books = {
                data["isbn"]: Book.objects.get_or_create(
                    isbn=data["isbn"], created_by=None, defaults=data
                )[0]
                for data in SHARED_BOOKS
            }
            notebook, _ = Book.objects.get_or_create(
                created_by=collector,
                title="Grandma's recipe notebook",
                defaults={"author": "Unknown"},
            )

            top = get_shelf(collector, "Living room", "Top")
            middle = get_shelf(collector, "Living room", "Middle")
            study = get_shelf(collector, "Study", "Notebooks")
            nightstand = get_shelf(reader, "Bedroom", "Nightstand")

            add_copy(
                collector,
                books["9780141439518"],
                top,
                status=Copy.Status.FINISHED,
                is_signed=True,
            )
            add_copy(
                collector, books["9780141439600"], middle, status=Copy.Status.READING
            )
            add_copy(collector, books["9780141441146"])
            add_copy(collector, notebook, study, edition_number=1, edition_size=1)
            add_copy(
                reader, books["9780141439518"], nightstand, status=Copy.Status.READING
            )
            add_copy(reader, books["9780141439570"], nightstand)

        self.stdout.write(self.style.SUCCESS("Seed data is in place."))
