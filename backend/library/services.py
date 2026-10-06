from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework import exceptions

from library.models import Bookcase, Shelf


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
