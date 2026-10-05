from rest_framework_nested import routers

from library.views import BookcaseViewSet, ShelfViewSet

router = routers.SimpleRouter()
router.register("bookcases", BookcaseViewSet, basename="bookcase")

bookcase_router = routers.NestedSimpleRouter(
    router, "bookcases", lookup="bookcase")
bookcase_router.register("shelves", ShelfViewSet, basename="shelf")

urlpatterns = router.urls + bookcase_router.urls
