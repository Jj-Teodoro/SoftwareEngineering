"""Security trail for admin and scanner accounts: sign-ins (and wrong-password attempts)
and the important things each account did. Shown on the admin's Settings page."""
import ipaddress
import logging

from django.db import DatabaseError, transaction

from .models import ActivityLog

KEEP_PER_USER = 200

logger = logging.getLogger(__name__)

LOGIN = "login"
FAILED = "failed"
ACTION = "action"


def client_ip(request):
  forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
  raw = forwarded.split(",")[0].strip() if forwarded else request.META.get("REMOTE_ADDR", "")
  try:
    return str(ipaddress.ip_address(raw))
  except ValueError:
    return None


def device_label(request):
  """"Chrome · Windows · Computer", the same shape the sites show for a device."""
  agent = request.META.get("HTTP_USER_AGENT", "")
  browser = next(
    (name for key, name in (("Edg/", "Edge"), ("OPR/", "Opera"), ("Firefox/", "Firefox"), ("Chrome/", "Chrome"), ("Safari/", "Safari")) if key in agent),
    "Browser",
  )
  system = next(
    (name for key, name in (("Windows", "Windows"), ("Android", "Android"), ("iPhone", "iOS"), ("iPad", "iOS"), ("Mac OS X", "macOS"), ("Linux", "Linux")) if key in agent),
    "",
  )
  if "iPad" in agent or "Tablet" in agent:
    kind = "Tablet"
  elif "Mobile" in agent or "iPhone" in agent:
    kind = "Phone"
  else:
    kind = "Computer"
  return " · ".join(part for part in (browser, system, kind) if part)


def record(request, user, kind, action="", detail=""):
  """Adds one entry for `user` and keeps only their latest KEEP_PER_USER."""
  # The trail must never get in the way of the action itself: if the table is not there
  # yet (migration not applied) or the database hiccups, carry on without it.
  try:
    with transaction.atomic():  # a savepoint, so a failure cannot spoil the caller's transaction
      ActivityLog.objects.create(
        user=user,
        kind=kind,
        action=action,
        detail=str(detail)[:200],
        ip_address=client_ip(request),
        device=device_label(request)[:160],
      )
      old = list(
        ActivityLog.objects.filter(user=user).order_by("-created_at").values_list("pk", flat=True)[KEEP_PER_USER:]
      )
      if old:
        ActivityLog.objects.filter(pk__in=old).delete()
  except DatabaseError:
    logger.warning("Could not record %s %s for %s", kind, action, user.pk, exc_info=True)
