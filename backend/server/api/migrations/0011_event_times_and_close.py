from django.db import migrations, models
from django.utils import timezone


def close_past_events(apps, schema_editor):
  # Events used to close by themselves when their day was over. Now an admin closes them,
  # so the ones that already happened are marked closed to keep them that way.
  Event = apps.get_model("api", "Event")
  Event.objects.filter(date__lt=timezone.localdate(), closed_at__isnull=True).update(closed_at=timezone.now())


class Migration(migrations.Migration):

  dependencies = [
    ("api", "0010_clearance_setting"),
  ]

  operations = [
    migrations.AddField(model_name="event", name="start_time", field=models.TimeField(blank=True, null=True)),
    migrations.AddField(model_name="event", name="end_time", field=models.TimeField(blank=True, null=True)),
    migrations.AddField(model_name="event", name="closed_at", field=models.DateTimeField(blank=True, null=True)),
    migrations.RunPython(close_past_events, migrations.RunPython.noop),
  ]
