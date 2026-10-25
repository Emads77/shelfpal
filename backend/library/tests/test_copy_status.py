from rest_framework.test import APITestCase

from library.models import Copy
from library.tests.base import LibraryTestMixin, make_copy


class CopyStatusTests(LibraryTestMixin, APITestCase):
    def patch(self, copy, **data):
        return self.client.patch(f"/api/copies/{copy.id}/", data, format="json")

    def test_anonymous_status_change_is_rejected(self):
        copy = make_copy(self.owner, None, "Shared")
        self.client.force_authenticate(None)

        response = self.patch(copy, status="finished")

        self.assertEqual(response.status_code, 401)
        copy.refresh_from_db()
        self.assertEqual(copy.status, Copy.Status.UNREAD)

    def test_invalid_status_is_rejected_and_the_copy_keeps_its_status(self):
        copy = make_copy(self.owner, None, "Shared")
        copy.status = Copy.Status.READING
        copy.save()

        response = self.patch(copy, status="abandoned")

        self.assertEqual(response.status_code, 400)
        self.assertIn("status", response.data)
        copy.refresh_from_db()
        self.assertEqual(copy.status, Copy.Status.READING)
