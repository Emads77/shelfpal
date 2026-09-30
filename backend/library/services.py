from django.shortcuts import get_object_or_404

from library.models import Bookcase, Shelf


def create_bookcase(owner, name):
    return Bookcase.objects.create(owner=owner, name=name)


def list_bookcases(owner):
    return Bookcase.objects.filter(owner=owner)


def create_shelf(owner, bookcase_id, name):
    bookcase = get_object_or_404(Bookcase, id=bookcase_id, owner=owner)
    return Shelf.objects.create(bookcase=bookcase, name=name)


def list_shelves(owner, bookcase_id):
    return Shelf.objects.filter(bookcase__owner=owner, bookcase_id=bookcase_id)
