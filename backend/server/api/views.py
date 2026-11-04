from datetime import datetime, time, timedelta
import re
import secrets

from django.db import DatabaseError, IntegrityError, transaction
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import User, Event, Attendance, Notification, SubmissionLog, Requirement, RequirementCompletion, Hobby, ActivityLog, ClearanceSetting
from .activity import record as log_activity, ACTION, FAILED, LOGIN
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import (
  UserSerializer,
  ProfileSerializer,
  StaffSelfSerializer,
  EventSerializer,
  AttendanceSerializer,
  NotificationSerializer,
  SubmissionLogSerializer,
  RequirementSerializer,
  RequirementCompletionSerializer,
  HobbySerializer,
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import (
  STAFF_ROLES,
  IsAdmin,
  IsStaff,
  ReadAnyWriteStaff,
  ReadAnyWriteAdmin,
  is_admin,
  is_staff_member,
)
from .utils import UserRole
from .hashers import set_temp_password

# Create your views here.

TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
MIN_PASSWORD_LENGTH = 6
# SRS SEC-06 / FR-05: replacing a temporary password needs at least 8 characters
MIN_FIRST_PASSWORD_LENGTH = 8


def generate_temp_password(length=10):
  return "".join(secrets.choice(TEMP_PASSWORD_ALPHABET) for _ in range(length))


def tokens_for(user):
  refresh = RefreshToken.for_user(user)
  return {"access": str(refresh.access_token), "refresh": str(refresh)}


# ---------------------------------------------------------------- auth

class LoginView(APIView):
  """Staff sign in with their username, students with their student number."""
  permission_classes = [AllowAny]
  authentication_classes = []

  def post(self, request):
    identifier = str(request.data.get("identifier", "")).strip()
    password = str(request.data.get("password", ""))
    portal = request.data.get("portal", "student")

    if not identifier or not password:
      return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    if portal == "admin":
      candidates = User.objects.filter(student_id__iexact=identifier, role=UserRole.ADMIN.value)
    elif portal in ("scanner", "staff"):
      candidates = User.objects.filter(student_id__iexact=identifier, role__in=STAFF_ROLES)
    else:
      candidates = User.objects.filter(student_id__iexact=identifier, role=UserRole.STUDENT.value)

    for user in candidates:
      if user.is_active and user.check_password(password):
        # record it before replying, so the response already has this sign-in time
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        if user.role in STAFF_ROLES:
          log_activity(request, user, LOGIN, detail=f"{portal} site")
        return Response({**tokens_for(user), "user": UserSerializer(user).data}, status=status.HTTP_200_OK)

    # a wrong password on a real admin or scanner account goes in that account's security trail
    tried = candidates.first()
    if tried is not None and tried.role in STAFF_ROLES:
      log_activity(request, tried, FAILED, detail=f"Wrong password on the {portal} site")
    return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
  """Cancels the session on the server: the refresh token can't be used again."""
  permission_classes = [AllowAny]
  authentication_classes = []

  def post(self, request):
    try:
      RefreshToken(str(request.data.get("refresh", ""))).blacklist()
    except TokenError:
      pass  # already expired or invalid: the session is over either way
    return Response(status=status.HTTP_204_NO_CONTENT)


class SafeTokenRefreshSerializer(TokenRefreshSerializer):
  """simplejwt looks the user up with .get() and crashes (500) when they were deleted."""

  def validate(self, attrs):
    try:
      return super().validate(attrs)
    except User.DoesNotExist:
      raise AuthenticationFailed("No active account found for the given token.", "no_active_account")


class SafeTokenRefreshView(TokenRefreshView):
  serializer_class = SafeTokenRefreshSerializer


class PasswordRequestView(APIView):
  """"I forgot my password": flags the account (student number or staff username)
  for an admin. Always succeeds so it can't be used to find out which accounts exist."""
  permission_classes = [AllowAny]
  authentication_classes = []

  def post(self, request):
    student_id = str(request.data.get("student_id", "")).strip()
    if not student_id:
      return Response({"student_id": ["Enter your Student ID."]}, status=status.HTTP_400_BAD_REQUEST)
    User.objects.filter(student_id__iexact=student_id).update(password_requested_at=timezone.now())
    return Response({"message": "Request sent"}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------- users

class CreateUserView(generics.CreateAPIView):
  queryset = User.objects.all()
  serializer_class = UserSerializer
  permission_classes = [IsAdmin]

  def perform_create(self, serializer):
    student = serializer.save()
    log_activity(self.request, self.request.user, ACTION, "student.added", student.student_id)

class UserListView(generics.ListAPIView):
  serializer_class = UserSerializer
  permission_classes = [IsStaff]

  def get_queryset(self):
    queryset = User.objects.all().order_by("student_id")
    for field in ("role", "program", "year_level", "section"):
      value = self.request.query_params.get(field)
      if value:
        queryset = queryset.filter(**{field: value})

    search = self.request.query_params.get("search")
    if search:
      queryset = queryset.filter(
        Q(student_id__icontains=search)
        | Q(first_name__icontains=search)
        | Q(middle_name__icontains=search)
        | Q(last_name__icontains=search)
      )
    return queryset

class CurrentUserView(APIView):
  permission_classes = [IsAuthenticated]

  def get(self, request):
    return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

  def patch(self, request):
    # admins and scanners change their name and email; students change their card details
    staff = is_staff_member(request.user)
    serializer_class = StaffSelfSerializer if staff else ProfileSerializer
    serializer = serializer_class(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    if staff:
      log_activity(request, request.user, ACTION, "profile.updated")
    return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

class ChangePasswordView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request):
    user = request.user
    current_password = str(request.data.get("current_password", ""))
    new_password = str(request.data.get("new_password", ""))

    if not user.check_password(current_password):
      return Response({"current_password": ["Current password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)
    min_length = MIN_FIRST_PASSWORD_LENGTH if user.must_change_password else MIN_PASSWORD_LENGTH
    if len(new_password) < min_length:
      return Response(
        {"new_password": [f"New password must be at least {min_length} characters."]},
        status=status.HTTP_400_BAD_REQUEST,
      )
    if new_password == current_password:
      return Response({"new_password": ["Choose a different password."]}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.must_change_password = False
    user.temp_password = ""
    user.save(update_fields=["password", "must_change_password", "temp_password"])
    if is_staff_member(user):
      log_activity(request, user, ACTION, "password.changed")
    return Response({"message": "Password updated"}, status=status.HTTP_200_OK)

class MyActivityView(APIView):
  """The signed-in admin's or scanner's own security trail: recent sign-ins (and wrong-password
  attempts) and recent actions."""
  permission_classes = [IsStaff]

  def get(self, request):
    def rows(queryset):
      return [
        {
          "id": str(entry.log_id),
          "kind": entry.kind,
          "action": entry.action,
          "detail": entry.detail,
          "ip": entry.ip_address,
          "device": entry.device,
          "at": entry.created_at,
        }
        for entry in queryset
      ]

    own = ActivityLog.objects.filter(user=request.user)
    day_ago = timezone.now() - timedelta(hours=24)
    return Response({
      "sign_ins": rows(own.filter(kind__in=[LOGIN, FAILED])[:15]),
      "actions": rows(own.filter(kind=ACTION)[:30]),
      "failed_last_day": own.filter(kind=FAILED, created_at__gte=day_ago).count(),
    }, status=status.HTTP_200_OK)

class ClearanceSettingView(APIView):
  """The points a student must earn to be cleared. Anyone signed in can read it; only admins
  change it. `required_points: null` means automatic (every requirement and event that applies
  to the student's program)."""
  permission_classes = [IsAuthenticated]

  MAX_POINTS = 100000

  def get(self, request):
    try:
      value = ClearanceSetting.objects.filter(pk=1).values_list("required_points", flat=True).first()
    except DatabaseError:
      value = None  # the migration is not applied yet: behave as automatic
    return Response({"required_points": value}, status=status.HTTP_200_OK)

  def patch(self, request):
    if not is_admin(request.user):
      self.permission_denied(request)
    raw = request.data.get("required_points")
    if raw is None or raw == "":
      value = None
    else:
      try:
        if isinstance(raw, bool):
          raise ValueError
        value = int(raw)
      except (TypeError, ValueError):
        return Response({"required_points": ["Enter a whole number of points."]}, status=status.HTTP_400_BAD_REQUEST)
      if value < 1 or value > self.MAX_POINTS:
        return Response(
          {"required_points": [f"Enter a number from 1 to {self.MAX_POINTS}."]}, status=status.HTTP_400_BAD_REQUEST
        )
    try:
      ClearanceSetting.objects.update_or_create(pk=1, defaults={"required_points": value})
    except DatabaseError:
      # most likely the migration for this table has not been applied on this database yet
      return Response(
        {"detail": "The database needs its update first (python manage.py migrate). Ask whoever runs the system."},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
      )
    log_activity(
      request, request.user, ACTION, "settings.clearance", "automatic" if value is None else f"{value} points"
    )
    return Response({"required_points": value}, status=status.HTTP_200_OK)

class PresenceView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request):
    online = bool(request.data.get("online", True))
    changes = {"last_seen": timezone.now(), "online": online}
    if is_staff_member(request.user):
      changes["presence_info"] = {
        key: str(request.data.get(key, ""))[:120] for key in ("app", "page", "event", "device")
      }
    User.objects.filter(pk=request.user.pk).update(**changes)
    return Response(status=status.HTTP_204_NO_CONTENT)

class UserDetailView(APIView):
  permission_classes = [IsStaff]

  def check_permissions(self, request):
    super().check_permissions(request)
    if request.method not in ("GET", "HEAD", "OPTIONS") and not is_admin(request.user):
      self.permission_denied(request)

  def get(self, request, student_id):
    user = get_object_or_404(User, student_id=student_id)
    serializer = UserSerializer(user, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)

  def patch(self, request, student_id):
    user = get_object_or_404(User, student_id=student_id)
    serializer = UserSerializer(user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    log_activity(request, request.user, ACTION, "student.updated", user.student_id)
    return Response({
        **serializer.data,
        "message": f"User {serializer.data["student_id"]} updated successfully"
      },
      status=status.HTTP_200_OK
    )


  def delete(self, request, student_id):
    user = get_object_or_404(User, student_id=student_id)
    if user == request.user:
      return Response({"detail": "You can't remove your own account."}, status=status.HTTP_400_BAD_REQUEST)
    log_activity(request, request.user, ACTION, "staff.removed" if user.role in STAFF_ROLES else "student.deleted", user.student_id)
    user.delete()
    return Response({
        "message": "User deleted successfully"
      },
      status=status.HTTP_200_OK
    )

class CreateUserBulkView(generics.CreateAPIView):
  queryset = User.objects.all()
  serializer_class = UserSerializer
  permission_classes = [IsAdmin]

  def create(self, request, *args, **kwargs):
    if not isinstance(request.data, list):
      return Response({
          "detail": "Expected data type is list for bulk user creation"
        },
        status=status.HTTP_400_BAD_REQUEST
      )

    serializer = self.get_serializer(data = request.data, many = True)
    serializer.is_valid(raise_exception = True)
    self.perform_create(serializer)
    log_activity(request, request.user, ACTION, "students.imported", f"{len(request.data)} students")
    headers = self.get_success_headers(serializer.data)
    return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class DeleteUserBulkView(APIView):
  permission_classes = [IsAdmin]

  def post(self, request):
    student_ids = request.data.get("student_ids")
    if not isinstance(student_ids, list):
      return Response({"student_ids": ["Expected a list of student IDs"]}, status=status.HTTP_400_BAD_REQUEST)
    # attendance, requirement progress and notifications go with the user (CASCADE)
    deleted, _ = User.objects.filter(student_id__in=student_ids).exclude(pk=request.user.pk).delete()
    log_activity(request, request.user, ACTION, "students.deleted", f"{len(student_ids)} students")
    return Response({"message": f"{deleted} record(s) deleted"}, status=status.HTTP_200_OK)

class AccountView(APIView):
  """An admin issues a student's login with a temporary password (or replaces it).
  The student must choose their own password on first sign-in."""
  permission_classes = [IsAdmin]

  def get(self, request, student_id):
    user = get_object_or_404(User, student_id=student_id)
    pending = user.has_usable_password() and user.must_change_password
    return Response({"temp_password": user.temp_password if pending else None}, status=status.HTTP_200_OK)

  def post(self, request, student_id):
    # the student signs in with their student number, so no email is needed
    user = get_object_or_404(User, student_id=student_id)
    temp_password = generate_temp_password()
    set_temp_password(user, temp_password)
    user.temp_password = temp_password
    user.must_change_password = True
    user.password_requested_at = None
    user.save(update_fields=["password", "temp_password", "must_change_password", "password_requested_at"])
    log_activity(request, request.user, ACTION, "password.issued", user.student_id)
    return Response({"student_id": user.student_id, "temp_password": temp_password}, status=status.HTTP_200_OK)

class MakeAdminView(APIView):
  """An admin makes a student an admin. They keep their student number as their username
  and sign in at /admin. A student without a login gets a temporary password, returned once."""
  permission_classes = [IsAdmin]

  def post(self, request, student_id):
    user = get_object_or_404(User, student_id=student_id)
    if user == request.user:
      return Response({"detail": "You can't change your own role."}, status=status.HTTP_400_BAD_REQUEST)
    if user.role == UserRole.ADMIN:
      return Response({"detail": "This person is already an admin."}, status=status.HTTP_400_BAD_REQUEST)

    fields = ["role"]
    temp_password = None
    if not user.has_usable_password():
      temp_password = generate_temp_password()
      set_temp_password(user, temp_password)
      user.temp_password = temp_password
      user.must_change_password = True
      fields += ["password", "temp_password", "must_change_password"]
    user.role = UserRole.ADMIN
    user.save(update_fields=fields)
    log_activity(request, request.user, ACTION, "student.made_admin", user.student_id)
    return Response(
      {"student_id": user.student_id, "role": user.role, "temp_password": temp_password},
      status=status.HTTP_200_OK,
    )

class BulkAccountView(APIView):
  """Creates logins for many students at once: {"student_ids": [...]}.

  Each student without an account gets a temporary password (returned once, here) and must
  choose their own on first sign-in. Students who already have an account, or who are not
  found, are listed under "skipped". Everything is saved with one bulk update."""
  permission_classes = [IsAdmin]
  MAX = 500

  def post(self, request):
    ids = request.data.get("student_ids") if isinstance(request.data, dict) else None
    if not isinstance(ids, list) or not ids:
      return Response({"detail": "Send student_ids as a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
    if len(ids) > self.MAX:
      return Response({"detail": f"At most {self.MAX} students per request."}, status=status.HTTP_400_BAD_REQUEST)

    ids = [str(i).strip() for i in ids]
    users = {u.student_id: u for u in User.objects.filter(student_id__in=ids, role=UserRole.STUDENT)}
    created, skipped, changed = [], [], []
    for student_id in dict.fromkeys(ids):  # keeps order, drops repeats
      user = users.get(student_id)
      if user is None:
        skipped.append({"student_id": student_id, "reason": "Student not found."})
        continue
      if user.has_usable_password():
        skipped.append({"student_id": student_id, "reason": "This student already has an account."})
        continue
      temp_password = generate_temp_password()
      set_temp_password(user, temp_password)
      user.temp_password = temp_password
      user.must_change_password = True
      user.password_requested_at = None
      changed.append(user)
      created.append({"student_id": student_id, "temp_password": temp_password})

    if changed:
      User.objects.bulk_update(
        changed, ["password", "temp_password", "must_change_password", "password_requested_at"], batch_size=500
      )
      log_activity(request, request.user, ACTION, "accounts.created", f"{len(changed)} students")
    return Response({"created": created, "skipped": skipped}, status=status.HTTP_200_OK)

class StaffListCreateView(APIView):
  """Admin and scanner accounts. Admins add both here; each starts with a
  temporary password and must choose their own on first sign-in."""
  permission_classes = [IsAdmin]

  USERNAME_PATTERN = re.compile(r"^[a-z0-9._-]{4,24}$")

  def get(self, request):
    staff = User.objects.filter(role__in=STAFF_ROLES).order_by("role", "first_name")
    return Response(UserSerializer(staff, many=True, context={"request": request}).data, status=status.HTTP_200_OK)

  # Optional details, the same ones a student record has (the admin form uses them).
  PROFILE_FIELDS = (
    "first_name", "middle_name", "last_name", "program", "year_level", "section",
    "status", "email", "contact_number", "address",
  )

  def post(self, request):
    data = request.data
    # scanners: a username and a name; admins: an ID number (student_id) and the student details
    username = str(data.get("username") or data.get("student_id") or "").strip().lower()
    role = data.get("role", UserRole.SCANNER.value)
    profile = {field: data[field] for field in self.PROFILE_FIELDS if field in data}
    if data.get("name"):
      profile["first_name"] = str(data["name"]).strip()

    if role not in STAFF_ROLES:
      return Response({"role": ["Role must be admin or scanner."]}, status=status.HTTP_400_BAD_REQUEST)
    if not str(profile.get("first_name", "")).strip() and not str(profile.get("last_name", "")).strip():
      return Response({"name": ["Enter the person's name."]}, status=status.HTTP_400_BAD_REQUEST)
    if not self.USERNAME_PATTERN.match(username):
      return Response(
        {"username": ["Username must be 4-24 letters, numbers, dots, dashes or underscores."]},
        status=status.HTTP_400_BAD_REQUEST,
      )
    # usernames share the login field with student numbers, so they must not collide
    if User.objects.filter(student_id__iexact=username).exists():
      return Response({"username": ["That username is already taken."]}, status=status.HTTP_400_BAD_REQUEST)

    # same validation as a student record (email format, year level 1-4, ...)
    serializer = UserSerializer(data={**profile, "student_id": username, "role": role})
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    temp_password = generate_temp_password()
    set_temp_password(user, temp_password)
    user.temp_password = temp_password
    user.must_change_password = True
    user.save(update_fields=["password", "temp_password", "must_change_password"])
    log_activity(request, request.user, ACTION, "staff.created", f"{username} ({role})")
    return Response(
      {"username": username, "role": role, "temp_password": temp_password}, status=status.HTTP_201_CREATED
    )


class PasswordRequestDismissView(APIView):
  permission_classes = [IsAdmin]

  def delete(self, request, student_id):
    User.objects.filter(student_id=student_id).update(password_requested_at=None)
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------- events

class EventListCreateView(generics.ListCreateAPIView):
  serializer_class = EventSerializer
  # anyone signed in reads events; only admins create them (scanners only scan)
  permission_classes = [ReadAnyWriteAdmin]

  def get_queryset(self):
    queryset = Event.objects.select_related("created_by").order_by("-created_at")
    category = self.request.query_params.get("category")
    if category:
      queryset = queryset.filter(category=category)
    return queryset

  def create(self, request, *args, **kwargs):
    many = isinstance(request.data, list)
    serializer = self.get_serializer(data=request.data, many=many)
    serializer.is_valid(raise_exception=True)
    self.perform_create(serializer)
    headers = self.get_success_headers(serializer.data)
    return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

  def perform_create(self, serializer):
    saved = serializer.save(created_by=self.request.user)
    for event in saved if isinstance(saved, list) else [saved]:
      log_activity(self.request, self.request.user, ACTION, "event.created", event.title)

class EventView(generics.RetrieveUpdateDestroyAPIView):
  queryset = Event.objects.select_related("created_by")
  serializer_class = EventSerializer
  permission_classes = [ReadAnyWriteAdmin]
  lookup_field = "event_id"

  def perform_update(self, serializer):
    event = serializer.save()
    log_activity(self.request, self.request.user, ACTION, "event.updated", event.title)

  def perform_destroy(self, instance):
    log_activity(self.request, self.request.user, ACTION, "event.deleted", instance.title)
    # take back the points awarded at this event before its attendance is removed
    with transaction.atomic():
      for attendance in instance.event.all():
        User.objects.filter(pk=attendance.user_id).update(points=F("points") - attendance.points_awarded)
      instance.delete()

class AnnounceEventView(APIView):
  """Sends the event to every student in its program as a fresh unread notification."""
  permission_classes = [IsAdmin]

  LABELS = {"new": "New event", "update": "Updated", "reminder": "Reminder"}

  def post(self, request, event_id):
    event = get_object_or_404(Event, event_id=event_id)
    kind = request.data.get("kind", "new")
    if kind not in self.LABELS:
      return Response({"kind": ["Expected new, update or reminder"]}, status=status.HTTP_400_BAD_REQUEST)
    message = str(request.data.get("message") or f"{self.LABELS[kind]}: {event.title} on {event.date:%b %d, %Y}")

    students = User.objects.filter(role=UserRole.STUDENT.value)
    if event.program_for:
      students = students.filter(program__in=event.program_for)

    now = timezone.now()
    with transaction.atomic():
      Notification.objects.bulk_create([
        Notification(
          user=student,
          event=event,
          title=event.title,
          message=message,
          kind=kind,
          notification_type="EVENT",
          created_at=now,
        )
        for student in students
      ])
      event.last_notified_at = now
      event.save(update_fields=["last_notified_at"])
    return Response({"notified": students.count()}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------- attendance

class AttendanceListCreateView(generics.ListCreateAPIView):
  serializer_class = AttendanceSerializer
  permission_classes = [ReadAnyWriteStaff]

  def get_queryset(self):
    queryset = Attendance.objects.all().order_by("-timestamp")
    # students only ever see their own attendance
    if not is_staff_member(self.request.user):
      return queryset.filter(user=self.request.user)

    event = self.request.query_params.get("event")
    user = self.request.query_params.get("user")
    if event:
      queryset = queryset.filter(event_id=event)
    if user:
      queryset = queryset.filter(user_id=user)
    return queryset

  def perform_create(self, serializer):
    if serializer.validated_data.get("scanned_by") is None:
      serializer.save(scanned_by=self.request.user)
    else:
      serializer.save()

class AttendanceView(generics.RetrieveUpdateDestroyAPIView):
  queryset = Attendance.objects.all()
  serializer_class = AttendanceSerializer
  permission_classes = [IsStaff]
  lookup_field = "attendance_id"

  def perform_destroy(self, instance):
    # take back the points that were awarded for this attendance
    with transaction.atomic():
      User.objects.filter(pk=instance.user_id).update(points=F("points") - instance.points_awarded)
      instance.delete()

def clock(value):
  """9:00 AM style"""
  return value.strftime("%I:%M %p").lstrip("0")


def scan_problem(event, timing_out):
  """Why a scan can't happen right now, or None. Time in opens at the start time, time out
  at the end time, and scanning stays open until an admin closes the event."""
  if event.closed_at:
    return "This event is closed. Scanning has ended."
  now = timezone.localtime().replace(tzinfo=None)
  day = event.date.strftime("%b %d, %Y").replace(" 0", " ")
  opens = datetime.combine(event.date, event.start_time or time.min)
  if now < opens:
    when = f" at {clock(event.start_time)}" if event.start_time else ""
    return f"Time in opens on {day}{when}."
  if timing_out and event.end_time and now < datetime.combine(event.date, event.end_time):
    return f"Already timed in. Time out opens at {clock(event.end_time)}, when the event ends."
  return None


class CloseEventView(APIView):
  """POST closes an event (scanning stops); DELETE opens it again."""
  permission_classes = [IsAdmin]

  def post(self, request, event_id):
    event = get_object_or_404(Event, event_id=event_id)
    if event.closed_at is None:
      event.closed_at = timezone.now()
      event.save(update_fields=["closed_at"])
      log_activity(request, request.user, ACTION, "event.closed", event.title)
    return Response(EventSerializer(event, context={"request": request}).data, status=status.HTTP_200_OK)

  def delete(self, request, event_id):
    event = get_object_or_404(Event, event_id=event_id)
    if event.closed_at is not None:
      event.closed_at = None
      event.save(update_fields=["closed_at"])
      log_activity(request, request.user, ACTION, "event.reopened", event.title)
    return Response(EventSerializer(event, context={"request": request}).data, status=status.HTTP_200_OK)


class ScanAttendanceView(APIView):
  """One scan: checks the student in, then out, then reports they're done."""
  permission_classes = [IsStaff]

  def post(self, request):
    event = get_object_or_404(Event, event_id=request.data.get("event"))
    student = get_object_or_404(User, student_id=request.data.get("user"))

    existing = Attendance.objects.filter(user=student, event=event).first()
    if existing is None or existing.time_out is None:
      problem = scan_problem(event, timing_out=existing is not None)
      if problem:
        return Response({"detail": problem}, status=status.HTTP_400_BAD_REQUEST)

    if existing is None:
      serializer = AttendanceSerializer(data={"user": student.pk, "event": str(event.pk)})
      serializer.is_valid(raise_exception=True)
      try:
        with transaction.atomic():
          record = serializer.save(scanned_by=request.user)
        action = "in"
      except IntegrityError:
        # another scan of the same student just checked them in (SRS FR-28)
        record, action = Attendance.objects.get(user=student, event=event), "already"
    elif existing.time_out is None:
      # timing out is what earns the event's points (the serializer adds them)
      serializer = AttendanceSerializer(existing, data={"time_out": timezone.now()}, partial=True)
      serializer.is_valid(raise_exception=True)
      record, action = serializer.save(), "out"
    else:
      record, action = existing, "already"

    if action != "already":
      log_activity(request, request.user, ACTION, f"attendance.{action}", f"{student.student_id} · {event.title}")
    return Response({"action": action, "record": AttendanceSerializer(record).data}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------- notifications

class NotificationListCreateView(generics.ListCreateAPIView):
  serializer_class = NotificationSerializer
  permission_classes = [ReadAnyWriteStaff]

  def get_queryset(self):
    queryset = Notification.objects.select_related("event").order_by("-created_at")
    if not is_staff_member(self.request.user):
      queryset = queryset.filter(user=self.request.user)
    else:
      user = self.request.query_params.get("user")
      if user:
        queryset = queryset.filter(user_id=user)
    read_status = self.request.query_params.get("read_status")
    if read_status is not None:
      queryset = queryset.filter(read_status=read_status.lower() == "true")
    return queryset

class NotificationView(generics.RetrieveUpdateDestroyAPIView):
  serializer_class = NotificationSerializer
  permission_classes = [IsAuthenticated]
  lookup_field = "notification_id"

  def get_queryset(self):
    queryset = Notification.objects.select_related("event")
    if is_staff_member(self.request.user):
      return queryset
    return queryset.filter(user=self.request.user)

  def update(self, request, *args, **kwargs):
    # a student may only mark their own notification as read
    if not is_staff_member(request.user) and set(request.data) - {"read_status"}:
      self.permission_denied(request)
    return super().update(request, *args, **kwargs)

  def destroy(self, request, *args, **kwargs):
    if not is_staff_member(request.user):
      self.permission_denied(request)
    return super().destroy(request, *args, **kwargs)

class MarkNotificationsReadView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request, student_id):
    user = get_object_or_404(User, student_id=student_id)
    if user != request.user and not is_staff_member(request.user):
      self.permission_denied(request)
    updated = Notification.objects.filter(user=user, read_status=False).update(read_status=True)
    return Response({
        "message": f"{updated} notification(s) marked as read"
      },
      status=status.HTTP_200_OK
    )


# ---------------------------------------------------------------- requirements

class RequirementListCreateView(generics.ListCreateAPIView):
  queryset = Requirement.objects.all().order_by("created_at")
  serializer_class = RequirementSerializer
  permission_classes = [ReadAnyWriteAdmin]

  def perform_create(self, serializer):
    requirement = serializer.save()
    log_activity(self.request, self.request.user, ACTION, "requirement.created", requirement.title)

class RequirementView(generics.RetrieveUpdateDestroyAPIView):
  queryset = Requirement.objects.all()
  serializer_class = RequirementSerializer
  permission_classes = [ReadAnyWriteAdmin]
  lookup_field = "requirement_id"

  def perform_update(self, serializer):
    requirement = serializer.save()
    log_activity(self.request, self.request.user, ACTION, "requirement.updated", requirement.title)

  def perform_destroy(self, instance):
    log_activity(self.request, self.request.user, ACTION, "requirement.deleted", instance.title)
    instance.delete()

class RequirementCompletionListView(generics.ListAPIView):
  serializer_class = RequirementCompletionSerializer
  permission_classes = [IsAuthenticated]

  def get_queryset(self):
    queryset = RequirementCompletion.objects.all()
    if not is_staff_member(self.request.user):
      return queryset.filter(student=self.request.user)
    student = self.request.query_params.get("student")
    return queryset.filter(student_id=student) if student else queryset

class ToggleRequirementCompletionView(APIView):
  permission_classes = [IsAdmin]

  def post(self, request):
    student = get_object_or_404(User, student_id=request.data.get("student"))
    requirement = get_object_or_404(Requirement, requirement_id=request.data.get("requirement"))
    deleted, _ = RequirementCompletion.objects.filter(student=student, requirement=requirement).delete()
    if not deleted:
      RequirementCompletion.objects.create(student=student, requirement=requirement)
    return Response({"completed": not deleted}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------- hobbies

class HobbyListCreateView(generics.ListCreateAPIView):
  queryset = Hobby.objects.all().order_by("label")
  serializer_class = HobbySerializer
  permission_classes = [ReadAnyWriteAdmin]


# ---------------------------------------------------------------- submission logs

class SubmissionLogListCreateView(generics.ListCreateAPIView):
  serializer_class = SubmissionLogSerializer
  permission_classes = [IsAdmin]

  def get_queryset(self):
    queryset = SubmissionLog.objects.all().order_by("-timestamp")
    activity = self.request.query_params.get("activity")
    action = self.request.query_params.get("action")
    if activity:
      queryset = queryset.filter(activity_id=activity)
    if action:
      queryset = queryset.filter(action=action)
    return queryset

class SubmissionLogView(generics.RetrieveUpdateDestroyAPIView):
  queryset = SubmissionLog.objects.all()
  serializer_class = SubmissionLogSerializer
  permission_classes = [IsAdmin]
  lookup_field = "log_id"
