from rest_framework import serializers

from library.models import Book, Bookcase, Copy, Shelf


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["id", "isbn", "title", "author", "publisher", "cover", "created_by"]
        read_only_fields = ["id", "created_by"]


class BookcaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookcase
        fields = ["id", "name", "owner"]
        read_only_fields = ["id", "owner"]


class ShelfSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shelf
        fields = ["id", "name", "bookcase"]
        read_only_fields = ["id", "bookcase"]


class ShelfBulkCreateSerializer(serializers.Serializer):
    names = serializers.ListField(
        child=serializers.CharField(max_length=200),
        allow_empty=False,
        max_length=50,
    )


class CopySerializer(serializers.ModelSerializer):
    class Meta:
        model = Copy
        fields = ["id", "owner", "book", "shelf"]
        read_only_fields = ["id", "owner"]


class PreviewCoverSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    cover = serializers.CharField(allow_blank=True)


class ShelfOverviewSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    book_count = serializers.IntegerField()
    preview_covers = PreviewCoverSerializer(many=True)


class BookcaseOverviewSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    shelf_count = serializers.IntegerField()
    book_count = serializers.IntegerField()
    shelves = ShelfOverviewSerializer(many=True)


class LibraryOverviewSerializer(serializers.Serializer):
    bookcases = BookcaseOverviewSerializer(many=True)
    unassigned_count = serializers.IntegerField()
