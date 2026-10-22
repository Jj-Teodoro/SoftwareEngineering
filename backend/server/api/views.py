import re
import secrets

from django.db import transaction
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import User, Event, Attendance, Notification, SubmissionLog, Requirement, RequirementCompletion, Hobby
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import (
  UserSerializer,
  ProfileSerializer,
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

# Create your views here.

TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
MIN_PASSWORD_LENGTH = 6


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
        return Response({**tokens_for(user), "user": UserSerializer(user).data}, status=status.HTTP_200_OK)

    return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


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
    serializer = ProfileSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

class ChangePasswordView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request):
    user = request.user
    current_password = str(request.data.get("current_password", ""))
    new_password = str(request.data.get("new_password", ""))

    if not user.check_password(current_password):
      return Response({"current_password": ["Current password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < MIN_PASSWORD_LENGTH:
      return Response(
        {"new_password": [f"New password must be at least {MIN_PASSWORD_LENGTH} characters."]},
        status=status.HTTP_400_BAD_REQUEST,
      )
    if new_password == current_password:
      return Response({"new_password": ["Choose a different password."]}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.must_change_password = False
    user.temp_password = ""
    user.save(update_fields=["password", "must_change_password", "temp_password"])
    return Response({"message": "Password updated"}, status=status.HTTP_200_OK)

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
    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)

  def patch(self, request, student_id):
    user = get_object_or_404(User, student_id=student_id)
    serializer = UserSerializer(user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
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
    user.set_password(temp_password)
    user.temp_password = temp_password
    user.must_change_password = True
    user.password_requested_at = None
    user.save(update_fields=["password", "temp_password", "must_change_password", "password_requested_at"])
    return Response({"student_id": user.student_id, "temp_password": temp_password}, status=status.HTTP_200_OK)

class StaffListCreateView(APIView):
  """Admin and scanner accounts. Admins add both here; each starts with a
  temporary password and must choose their own on first sign-in."""
  permission_classes = [IsAdmin]

  USERNAME_PATTERN = re.compile(r"^[a-z0-9._-]{4,24}$")

  def get(self, request):
    staff = User.objects.filter(role__in=STAFF_ROLES).order_by("role", "first_name")
    return Response(UserSerializer(staff, many=True).data, status=status.HTTP_200_OK)

  def post(self, request):
    name = str(request.data.get("name", "")).strip()
    username = str(request.data.get("username", "")).strip().lower()
    role = request.data.get("role", UserRole.SCANNER.value)
    if role not in STAFF_ROLES:
      return Response({"role": ["Role must be admin or scanner."]}, status=status.HTTP_400_BAD_REQUEST)
    if not name:
      return Response({"name": ["Enter the person's name."]}, status=status.HTTP_400_BAD_REQUEST)
    if not self.USERNAME_PATTERN.match(username):
      return Response(
        {"username": ["Username must be 4-24 letters, numbers, dots, dashes or underscores."]},
        status=status.HTTP_400_BAD_REQUEST,
      )
    # usernames share the login field with student numbers, so they must not collide
    if User.objects.filter(student_id__iexact=username).exists():
      return Response({"username": ["That username is already taken."]}, status=status.HTTP_400_BAD_REQUEST)

    temp_password = generate_temp_password()
    user = User.objects.create_user(
      username, temp_password, first_name=name, role=role, must_change_password=True,
    )
    user.temp_password = temp_password
    user.save(update_fields=["temp_password"])
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
  permission_classes = [ReadAnyWriteStaff]

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
    serializer.save(created_by=self.request.user)

class EventView(generics.RetrieveUpdateDestroyAPIView):
  queryset = Event.objects.select_related("created_by")
  serializer_class = EventSerializer
  permission_classes = [ReadAnyWriteStaff]
  lookup_field = "event_id"

  def perform_destroy(self, instance):
    # take back the points awarded at this event before its attendance is removed
    with transaction.atomic():
      for attendance in instance.event.all():
        User.objects.filter(pk=attendance.user_id).update(points=F("points") - attendance.points_awarded)
      instance.delete()

class AnnounceEventView(APIView):
  """Sends the event to every student in its program as a fresh unread notification."""
  permission_classes = [IsStaff]

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

class ScanAttendanceView(APIView):
  """One scan: checks the student in, then out, then reports they're done."""
  permission_classes = [IsStaff]

  def post(self, request):
    event = get_object_or_404(Event, event_id=request.data.get("event"))
    student = get_object_or_404(User, student_id=request.data.get("user"))

    existing = Attendance.objects.filter(user=student, event=event).first()
    if existing is None:
      serializer = AttendanceSerializer(data={"user": student.pk, "event": str(event.pk)})
      serializer.is_valid(raise_exception=True)
      record = serializer.save(scanned_by=request.user)
      action = "in"
    elif existing.time_out is None:
      existing.time_out = timezone.now()
      existing.save(update_fields=["time_out"])
      record, action = existing, "out"
    else:
      record, action = existing, "already"

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

class RequirementView(generics.RetrieveUpdateDestroyAPIView):
  queryset = Requirement.objects.all()
  serializer_class = RequirementSerializer
  permission_classes = [ReadAnyWriteAdmin]
  lookup_field = "requirement_id"

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
