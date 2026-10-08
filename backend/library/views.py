from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from library import services
from library.serializers import (
    BookcaseSerializer,
    CopyIdsSerializer,
    CopyListQuerySerializer,
    CopyMoveSerializer,
    CopyReadSerializer,
    CopyUpdateSerializer,
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


class CopyViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    lookup_value_regex = r"\d+"

    def list(self, request):
        query = CopyListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        copies = services.list_copies(request.user, **query.validated_data)
        return Response(CopyReadSerializer(copies, many=True).data)

    def partial_update(self, request, pk=None):
        serializer = CopyUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        copy = services.update_copy(
            request.user, pk, serializer.validated_data["is_read"]
        )
        return Response(CopyReadSerializer(copy).data)

    @action(detail=False, methods=["post"], url_path="move")
    def bulk_move(self, request):
        serializer = CopyMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        count = services.move_copies(
            request.user,
            serializer.validated_data["ids"],
            serializer.validated_data["shelf"],
        )
        return Response({"count": count})

    @action(detail=False, methods=["post"], url_path="delete")
    def bulk_delete(self, request):
        serializer = CopyIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        count = services.delete_copies(request.user, serializer.validated_data["ids"])
        return Response({"count": count})
