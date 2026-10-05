from django.contrib import admin
from .models import Book, Bookcase, Shelf, Copy

admin.site.register(Book)
admin.site.register(Bookcase)
admin.site.register(Shelf)
admin.site.register(Copy)
