from unittest.mock import patch

from django.test import TestCase


class HealthTests(TestCase):
    def test_health_is_ok_without_authentication(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_health_accepts_head_requests(self):
        response = self.client.head("/api/health/")

        self.assertEqual(response.status_code, 200)

    def test_health_rejects_other_methods(self):
        response = self.client.post("/api/health/")

        self.assertEqual(response.status_code, 405)

    def test_health_reports_a_database_failure(self):
        with patch("config.views.connection") as connection:
            connection.cursor.side_effect = Exception("database down")
            response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "error")
