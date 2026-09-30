from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from library import services
from library.serializers import BookcaseSerializer, ShelfSerializer


@api_view(["GET"])
def ping(request):
    return Response({"message": "pong from Django"})


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
