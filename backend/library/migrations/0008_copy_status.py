from django.db import migrations, models


def is_read_to_status(apps, schema_editor):
    Copy = apps.get_model("library", "Copy")
    Copy.objects.filter(is_read=True).update(status="finished")


def status_to_is_read(apps, schema_editor):
    Copy = apps.get_model("library", "Copy")
    Copy.objects.filter(status="finished").update(is_read=True)


class Migration(migrations.Migration):
    dependencies = [("library", "0007_book_copied_from")]

    operations = [
        migrations.AddField(
            model_name="copy",
            name="status",
            field=models.CharField(
                choices=[
                    ("unread", "Unread"),
                    ("reading", "Reading"),
                    ("finished", "Finished"),
                ],
                default="unread",
                max_length=10,
            ),
        ),
        migrations.RunPython(is_read_to_status, status_to_is_read),
        migrations.RemoveField(model_name="copy", name="is_read"),
    ]
