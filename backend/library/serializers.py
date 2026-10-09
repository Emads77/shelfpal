from rest_framework import serializers

from library.models import Book, Bookcase, Copy, Shelf

MAX_BULK_COPIES = 200


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


class CopyBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["id", "title", "author", "cover"]


class CopyReadSerializer(serializers.ModelSerializer):
    book = CopyBookSerializer(read_only=True)

    class Meta:
        model = Copy
        fields = ["id", "book", "shelf", "is_read"]


class CopyListQuerySerializer(serializers.Serializer):
    shelf = serializers.IntegerField(required=False, min_value=1)
    unassigned = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        if attrs.get("shelf") is not None and attrs["unassigned"]:
            raise serializers.ValidationError(
                "Use either shelf or unassigned, not both."
            )
        return attrs


class CopyUpdateSerializer(serializers.Serializer):
    is_read = serializers.BooleanField()


class CopyIdsSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
        max_length=MAX_BULK_COPIES,
    )


class CopyMoveSerializer(CopyIdsSerializer):
    # An explicit null means "unassigned"
    shelf = serializers.IntegerField(allow_null=True, min_value=1)


class ManualBookCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    author = serializers.CharField(max_length=200)
    isbn = serializers.CharField(
        max_length=17, required=False, allow_blank=True, allow_null=True
    )
    publisher = serializers.CharField(max_length=200, required=False, allow_blank=True)
    cover = serializers.URLField(required=False, allow_blank=True)
    shelf = serializers.IntegerField(required=False, allow_null=True, min_value=1)

    def validate_isbn(self, value):
        if value is None:
            return None
        value = value.replace("-", "").strip()
        if not value:
            return None
        if len(value) not in (10, 13):
            raise serializers.ValidationError("ISBN must be 10 or 13 characters.")
        return value


class ISBNLookupSerializer(serializers.Serializer):
    isbn = serializers.CharField()

    def validate_isbn(self, value):
        value = value.replace("-", "").strip()
        if len(value) not in (10, 13):
            raise serializers.ValidationError("ISBN must be 10 or 13 characters.")
        return value


class BookSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["id", "isbn", "title", "author", "publisher", "cover"]
