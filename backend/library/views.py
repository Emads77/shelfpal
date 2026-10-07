from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from library import services
from library.serializers import (
    BookcaseSerializer,
    LibraryOverviewSerializer,
    ShelfBulkCreateSerializer,
    ShelfSerializer,
)


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

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request, bookcase_pk=None):
        serializer = ShelfBulkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shelves = services.create_shelves(
            owner=request.user,
            bookcase_id=bookcase_pk,
            names=serializer.validated_data["names"],
        )
        return Response(ShelfSerializer(shelves, many=True).data, status=201)

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


class LibraryOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = services.get_library_overview(request.user)
        return Response(LibraryOverviewSerializer(data).data)
