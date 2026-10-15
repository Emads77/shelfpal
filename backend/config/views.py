import logging

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_safe

logger = logging.getLogger("shelfpal.health")


@require_safe
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        logger.exception("Health check failed: database unreachable")
        return JsonResponse({"status": "error", "database": "down"}, status=503)
    return JsonResponse({"status": "ok"})
