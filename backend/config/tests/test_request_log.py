from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()


class RequestLogTests(APITestCase):
    def test_every_request_is_logged_with_its_details(self):
        with self.assertLogs("shelfpal.request", level="INFO") as logs:
            response = self.client.get("/api/health/")

        record = logs.records[0]
        self.assertEqual(record.method, "GET")
        self.assertEqual(record.path, "/api/health/")
        self.assertEqual(record.endpoint, "health")
        self.assertEqual(record.status, 200)
        self.assertIsNone(record.user_id)
        self.assertGreaterEqual(record.duration_ms, 0)
        self.assertEqual(record.request_id, response["X-Request-Id"])

    def test_a_valid_incoming_request_id_is_reused(self):
        response = self.client.get("/api/health/", HTTP_X_REQUEST_ID="abc-12345678")

        self.assertEqual(response["X-Request-ID"], "abc-12345678")

    def test_an_invalid_incoming_request_id_is_replaced(self):
        response = self.client.get("/api/health/", HTTP_X_REQUEST_ID="x\ny")

        self.assertNotEqual(response["X-Request-ID"], "x\ny")
        self.assertEqual(len(response["X-Request-ID"]), 32)

    def test_the_authenticated_user_id_is_logged(self):
        user = User.objects.create_user(
            username="logger", email="logger@example.com", password="a-Strong-pass-1"
        )
        self.client.force_authenticate(user)

        with self.assertLogs("shelfpal.request", level="INFO") as logs:
            self.client.get("/api/overview/")

        self.assertEqual(logs.records[0].user_id, user.id)

    def test_server_errors_are_logged_at_error_level(self):
        self.client.raise_request_exception = False

        with self.assertLogs("shelfpal.request", level="INFO") as request_logs:
            with self.assertLogs("django.request", level="ERROR"):
                with self.settings(ROOT_URLCONF="config.tests.urls_failing"):
                    self.client.get("/boom/")

        self.assertEqual(request_logs.records[0].levelname, "ERROR")
        self.assertEqual(request_logs.records[0].status, 500)
