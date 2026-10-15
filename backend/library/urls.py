from django.urls import path
from rest_framework_nested import routers

from library.views import (
    BookcaseViewSet,
    BookLookupView,
    CopyViewSet,
    LibraryOverviewView,
    ShelfViewSet,
)

router = routers.SimpleRouter()
router.register("bookcases", BookcaseViewSet, basename="bookcase")
router.register("copies", CopyViewSet, basename="copy")

bookcase_router = routers.NestedSimpleRouter(router, "bookcases", lookup="bookcase")
bookcase_router.register("shelves", ShelfViewSet, basename="shelf")


urlpatterns = [
    path("overview/", LibraryOverviewView.as_view(), name="library-overview"),
    path("books/lookup/", BookLookupView.as_view()),
    *router.urls,
    *bookcase_router.urls,
]
