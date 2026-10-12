import json
import logging
import sys

from django.test import SimpleTestCase

from config.log_utils import JsonFormatter


class JsonFormatterTests(SimpleTestCase):
    def make_record(self, **extra):
        record = logging.LogRecord(
            "shelfpal.test", logging.WARNING, __file__, 1, "hello %s", ("world",), None
        )
        for key, value in extra.items():
            setattr(record, key, value)
        return record

    def test_output_is_json_with_the_standard_fields_and_extras(self):
        output = JsonFormatter().format(self.make_record(status=500, request_id="r1"))

        data = json.loads(output)
        self.assertEqual(data["level"], "WARNING")
        self.assertEqual(data["logger"], "shelfpal.test")
        self.assertEqual(data["message"], "hello world")
        self.assertEqual(data["status"], 500)
        self.assertEqual(data["request_id"], "r1")
        self.assertIn("timestamp", data)

    def test_exceptions_are_included(self):
        try:
            raise ValueError("boom")
        except ValueError:
            record = self.make_record()
            record.exc_info = sys.exc_info()

        data = json.loads(JsonFormatter().format(record))

        self.assertIn("ValueError: boom", data["exception"])

    def test_values_that_are_not_json_are_converted_to_text(self):
        output = JsonFormatter().format(self.make_record(thing=object()))

        self.assertIsInstance(json.loads(output)["thing"], str)
