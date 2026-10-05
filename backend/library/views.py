from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from library import services
from library.serializers import BookcaseSerializer, ShelfSerializer


class BookcaseViewSet(viewsets.ModelViewSet):
    serializer_class = BookcaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return services.list_bookcases(self.request.user)

    def perform_create(self, serializer):
        serializer.instance = services.create_bookcase(
            owner=self.request.user,
            name=serializer.validated_data["name"],
        )

    def perform_update(self, serializer):
        serializer.instance = services.update_bookcase(
            owner=self.request.user,
            bookcase_id=self.kwargs["pk"],
            name=serializer.validated_data["name"],
        )

    def perform_destroy(self, instance):
        services.delete_bookcase(self.request.user, instance.id)


class ShelfViewSet(viewsets.ModelViewSet):
    serializer_class = ShelfSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return services.list_shelves(
            self.request.user,
            self.kwargs["bookcase_pk"],
        )

    def perform_create(self, serializer):
        serializer.instance = services.create_shelf(
            owner=self.request.user,
            bookcase_id=self.kwargs["bookcase_pk"],
            name=serializer.validated_data["name"],
        )

    def perform_update(self, serializer):
        serializer.instance = services.update_shelf(
            owner=self.request.user,
            bookcase_id=self.kwargs["bookcase_pk"],
            shelf_id=self.kwargs["pk"],
            name=serializer.validated_data["name"],
        )

    def perform_destroy(self, instance):
        bookcase_id = self.kwargs["bookcase_pk"]
        services.delete_shelf(self.request.user, bookcase_id, instance.id)
