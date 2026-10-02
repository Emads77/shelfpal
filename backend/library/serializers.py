from rest_framework import serializers
from library.models import Book, Bookcase, Shelf, Copy


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'isbn', 'title', 'author',
                  'publisher', 'cover', 'created_by']
        read_only_fields = ['id', 'created_by']


class BookcaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookcase
        fields = ['id', 'name', 'owner']
        read_only_fields = ['id', 'owner']


class ShelfSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shelf
        fields = ['id', 'name', 'bookcase']
        read_only_fields = ['id', 'bookcase']


class CopySerializer(serializers.ModelSerializer):
    class Meta:
        model = Copy
        fields = ['id', 'owner', 'book', 'shelf']
        read_only_fields = ['id', 'owner']
