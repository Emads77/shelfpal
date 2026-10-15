import logging
import re
import time
import uuid

from config.log_utils import request_id_var

logger = logging.getLogger("shelfpal.request")

# Pattern to only accept requests that look like ids
VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9-]{8,64}$")


class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        incoming = request.headers.get("X-request-ID", "")
        request_id = incoming if VALID_REQUEST_ID.match(incoming) else uuid.uuid4().hex
        token = request_id_var.set(request_id)
        started = time.perf_counter()
        try:
            response = self.get_response(request)
            duration_ms = round((time.perf_counter() - started) * 1000, 1)

            user = getattr(request, "user", None)
            user_id = user.pk if getattr(user, "is_authenticated", False) else None
            match = request.resolver_match

            logger.log(
                logging.ERROR if response.status_code >= 500 else logging.INFO,
                "%s %s %s %sms",
                request.method,
                request.path,
                response.status_code,
                duration_ms,
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.path,
                    "endpoint": match.view_name if match else None,
                    "status": response.status_code,
                    "duration_ms": duration_ms,
                    "user_id": user_id,
                },
            )
            response["X-Request-ID"] = request_id
            return response
        finally:
            request_id_var.reset(token)
