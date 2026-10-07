from django.conf import settings
from django.db import models


class Book(models.Model):
    isbn = models.CharField(  # noqa: DJ001 nullable so a future unique constraint treats missing ISBNs as distinct
        max_length=13, null=True, blank=True
    )
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    publisher = models.CharField(max_length=200, blank=True)
    cover = models.URLField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_books",
    )

    def __str__(self):
        return f"{self.title}"


class Bookcase(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookcases"
    )

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name"], name="unique_bookcase_name_per_owner"
            )
        ]

    def __str__(self):
        return f"{self.name}"


class Shelf(models.Model):
    name = models.CharField(max_length=200)
    bookcase = models.ForeignKey(
        Bookcase, on_delete=models.CASCADE, related_name="shelves"
    )

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["bookcase", "name"], name="unique_shelf_per_bookcase"
            )
        ]

    def __str__(self):
        return f"{self.bookcase.name} -> {self.name}"


class Copy(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="copies"
    )
    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name="copies")
    shelf = models.ForeignKey(
        Shelf, on_delete=models.SET_NULL, null=True, blank=True, related_name="copies"
    )
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.book.title} [{self.owner.username}]"
