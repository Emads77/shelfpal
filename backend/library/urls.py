from django.urls import path
from rest_framework_nested import routers

from library.views import BookcaseViewSet, LibraryOverviewView, ShelfViewSet

router = routers.SimpleRouter()
router.register("bookcases", BookcaseViewSet, basename="bookcase")

bookcase_router = routers.NestedSimpleRouter(router, "bookcases", lookup="bookcase")
bookcase_router.register("shelves", ShelfViewSet, basename="shelf")

urlpatterns = [
    path("overview/", LibraryOverviewView.as_view(), name="library-overview"),
    *router.urls,
    *bookcase_router.urls,
]
