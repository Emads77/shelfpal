from collections import defaultdict

from django.db import IntegrityError, transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import exceptions

from library.models import Bookcase, Copy, Shelf

PREVIEW_LIMIT = 8


def create_bookcase(owner, name):
    try:
        with transaction.atomic():
            return Bookcase.objects.create(owner=owner, name=name)
    except IntegrityError:
        raise exceptions.ValidationError(
            {"name": "You already have a bookcase with this name"}
        )


def update_bookcase(owner, bookcase_id, name):
    bookcase = get_object_or_404(Bookcase, id=bookcase_id, owner=owner)
    try:
        with transaction.atomic():
            bookcase.name = name
            bookcase.save()
            return bookcase
    except IntegrityError:
        raise exceptions.ValidationError(
            {"name": "You already have a bookcase with this name"}
        )


def delete_bookcase(owner, bookcase_id):
    bookcase = get_object_or_404(Bookcase, id=bookcase_id, owner=owner)
    bookcase.delete()


def list_bookcases(owner):
    return Bookcase.objects.filter(owner=owner)


def create_shelf(owner, bookcase_id, name):
    bookcase = get_object_or_404(Bookcase, id=bookcase_id, owner=owner)
    try:
        with transaction.atomic():
            return Shelf.objects.create(bookcase=bookcase, name=name)
    except IntegrityError:
        raise exceptions.ValidationError(
            {"name": "You already have a shelf with this name in this bookcase"}
        )


def create_shelves(owner, bookcase_id, names):
    bookcase = get_object_or_404(Bookcase, id=bookcase_id, owner=owner)

    duplicated = sorted({n for n in names if names.count(n) > 1})
    if duplicated:
        raise exceptions.ValidationError(
            {"names": f"Each name can only be used once: {', '.join(duplicated)}"}
        )

    taken = sorted(
        bookcase.shelves.filter(name__in=names).values_list("name", flat=True)
    )
    if taken:
        raise exceptions.ValidationError(
            {"names": f"Already used in this bookcase: {', '.join(taken)}"}
        )

    try:
        with transaction.atomic():
            return Shelf.objects.bulk_create(
                [Shelf(bookcase=bookcase, name=name) for name in names]
            )
    except IntegrityError:
        raise exceptions.ValidationError(
            {"names": "One of these names is already used in this bookcase"}
        )


def update_shelf(owner, bookcase_id, shelf_id, name):
    bookcase = get_object_or_404(Bookcase, id=bookcase_id, owner=owner)
    shelf = get_object_or_404(Shelf, id=shelf_id, bookcase=bookcase)
    try:
        with transaction.atomic():
            shelf.name = name
            shelf.save()
            return shelf
    except IntegrityError:
        raise exceptions.ValidationError(
            {"name": "You already have a shelf with this name in this bookcase"}
        )


def delete_shelf(owner, bookcase_id, shelf_id):
    bookcase = get_object_or_404(Bookcase, id=bookcase_id, owner=owner)
    shelf = get_object_or_404(Shelf, id=shelf_id, bookcase=bookcase)
    shelf.delete()


def list_shelves(owner, bookcase_id):
    bookcase = get_object_or_404(Bookcase, id=bookcase_id, owner=owner)
    return bookcase.shelves.all()


def get_library_overview(owner):
    bookcases = Bookcase.objects.filter(owner=owner).prefetch_related("shelves")
    placed = Copy.objects.filter(owner=owner, shelf__isnull=False)

    counts = dict(placed.order_by().values_list("shelf_id").annotate(n=Count("id")))

    previews = defaultdict(list)
    rows = placed.order_by("-id").values("id", "shelf_id", "book__title", "book__cover")
    for row in rows:
        bucket = previews[row["shelf_id"]]
        if len(bucket) < PREVIEW_LIMIT:
            bucket.append(
                {
                    "id": row["id"],
                    "title": row["book__title"],
                    "cover": row["book__cover"],
                }
            )

    overview = []
    for bookcase in bookcases:
        shelves = []
        book_count = 0
        for shelf in bookcase.shelves.all():
            shelf_books = counts.get(shelf.id, 0)
            book_count += shelf_books
            shelves.append(
                {
                    "id": shelf.id,
                    "name": shelf.name,
                    "book_count": shelf_books,
                    "preview_covers": previews.get(shelf.id, []),
                }
            )
        overview.append(
            {
                "id": bookcase.id,
                "name": bookcase.name,
                "shelf_count": len(shelves),
                "book_count": book_count,
                "shelves": shelves,
            }
        )

    unassigned = Copy.objects.filter(owner=owner, shelf__isnull=True).count()
    return {"bookcases": overview, "unassigned_count": unassigned}
