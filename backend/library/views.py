from drf_spectacular.utils import (
    OpenApiResponse,
    PolymorphicProxySerializer,
    extend_schema,
    extend_schema_view,
)
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from library import services
from library.external import ExternalLookupError
from library.serializers import (
    BookcaseSerializer,
    BookSummarySerializer,
    CopyDetailSerializer,
    CopyFromBookCreateSerializer,
    CopyIdsSerializer,
    CopyListQuerySerializer,
    CopyMoveSerializer,
    CopyReadSerializer,
    CopyUpdateSerializer,
    CountResponseSerializer,
    ISBNLookupSerializer,
    LibraryOverviewSerializer,
    ManualBookCreateSerializer,
    ShelfBulkCreateSerializer,
    ShelfSerializer,
)


class BookcaseViewSet(viewsets.ModelViewSet):
    serializer_class = BookcaseSerializer
    permission_classes = [IsAuthenticated]
    lookup_value_regex = r"\d+"

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
    lookup_value_regex = r"\d+"

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

    @extend_schema(
        request=ShelfBulkCreateSerializer,
        responses={201: ShelfSerializer(many=True)},
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

    @extend_schema(responses=LibraryOverviewSerializer)
    def get(self, request):
        data = services.get_library_overview(request.user)
        return Response(LibraryOverviewSerializer(data).data)


@extend_schema_view(
    list=extend_schema(
        parameters=[CopyListQuerySerializer],
        responses=CopyReadSerializer(many=True),
    ),
    create=extend_schema(
        request=PolymorphicProxySerializer(
            component_name="CopyCreate",
            serializers=[CopyFromBookCreateSerializer, ManualBookCreateSerializer],
            resource_type_field_name=None,
        ),
        responses={201: CopyReadSerializer},
    ),
    retrieve=extend_schema(responses=CopyDetailSerializer),
    partial_update=extend_schema(
        request=CopyUpdateSerializer,
        responses=CopyDetailSerializer,
    ),
)
class CopyViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    lookup_value_regex = r"\d+"

    def list(self, request):
        query = CopyListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        copies = services.list_copies(request.user, **query.validated_data)
        return Response(CopyReadSerializer(copies, many=True).data)

    def create(self, request):
        if "book" in request.data:
            serializer = CopyFromBookCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            copy = services.add_book_by_book_id(
                request.user,
                serializer.validated_data["book"],
                serializer.validated_data.get("shelf"),
                details=serializer.validated_data,
            )
        else:
            serializer = ManualBookCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            copy = services.add_book_manually(request.user, serializer.validated_data)
        return Response(CopyReadSerializer(copy).data, status=201)

    def retrieve(self, request, pk=None):
        copy = services.get_copy(request.user, pk)
        return Response(CopyDetailSerializer(copy).data)

    def partial_update(self, request, pk=None):
        copy = services.get_copy(request.user, pk)
        serializer = CopyUpdateSerializer(data=request.data, context={"copy": copy})
        serializer.is_valid(raise_exception=True)
        copy = services.update_copy(copy, serializer.validated_data)
        return Response(CopyDetailSerializer(copy).data)

    @extend_schema(request=CopyMoveSerializer, responses=CountResponseSerializer)
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

    @extend_schema(request=CopyIdsSerializer, responses=CountResponseSerializer)
    @action(detail=False, methods=["post"], url_path="delete")
    def bulk_delete(self, request):
        serializer = CopyIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        count = services.delete_copies(request.user, serializer.validated_data["ids"])
        return Response({"count": count})


class BookLookupView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[ISBNLookupSerializer],
        responses={
            200: BookSummarySerializer,
            404: OpenApiResponse(description="No book found for this ISBN."),
            503: OpenApiResponse(description="The external lookup is unavailable."),
        },
    )
    def get(self, request):
        serializer = ISBNLookupSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        try:
            book = services.get_or_fetch_book(serializer.validated_data["isbn"])
        except ExternalLookupError:
            return Response(
                {"detail": "Book lookup is unavailable right now."}, status=503
            )
        if book is None:
            return Response({"detail": "No book found for this ISBN."}, status=404)
        return Response(BookSummarySerializer(book).data)
