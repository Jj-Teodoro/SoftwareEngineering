from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from io import StringIO
from django.core.management import call_command
from api.models import User, Event, Attendance, Notification, SubmissionLog, Requirement, RequirementCompletion
from api.serializers import UserSerializer, EventSerializer, AttendanceSerializer


def make_user(student_id="2024-01072", **overrides):
  data = {
    "first_name": "Jemima Anne Marie",
    "middle_name": "Jurlano",
    "last_name": "Bontia",
    "email": "JemimaBontia@gmail.com",
    "program": "Bachelor of Science in Business Administration",
    "year_level": 1,
    "section": "BSBA-1D",
    "points": 0,
    "role": "student",
  }
  data.update(overrides)
  return User.objects.create_user(student_id=student_id, password="JMC090907", **data)


def staff_user(role="admin"):
  return User.objects.create_user(f"staff-{role}", "StaffPass1", first_name="Staff", last_name=role.title(), role=role)


def authenticated_client(user=None):
  """APIClient logged in as an admin (created on demand)"""
  client = APIClient()
  client.force_authenticate(user=user or staff_user())
  return client


class AuthTest(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = make_user("2024-00001")

  def test_obtain_token(self):
    response = self.client.post("/api/token", {"student_id": "2024-00001", "password": "JMC090907"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn("access", response.data)
    self.assertIn("refresh", response.data)

  def test_obtain_token_wrong_password(self):
    response = self.client.post("/api/token", {"student_id": "2024-00001", "password": "wrong"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_refresh_token(self):
    refresh = self.client.post("/api/token", {"student_id": "2024-00001", "password": "JMC090907"}, format="json").data["refresh"]
    response = self.client.post("/api/token/refresh", {"refresh": refresh}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn("access", response.data)

  def test_token_grants_access(self):
    access = self.client.post("/api/token", {"student_id": "2024-00001", "password": "JMC090907"}, format="json").data["access"]
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    response = self.client.get("/api/user/me")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["student_id"], "2024-00001")

  def test_endpoints_require_authentication(self):
    for url in ["/api/user", "/api/user/me", "/api/user/2024-00001", "/api/event", "/api/attendance", "/api/notification", "/api/log"]:
      self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED, url)
    self.assertEqual(self.client.post("/api/user/register", {}, format="json").status_code, status.HTTP_401_UNAUTHORIZED)

  def test_create_superuser(self):
    admin = User.objects.create_superuser("admin-01", "AdminPass1", first_name="A", last_name="B", email="a@b.com")
    self.assertTrue(admin.is_staff)
    self.assertEqual(admin.role, "admin")
    self.assertFalse(self.user.is_staff)


class UserViewTest(TestCase):
  """User Test for View Methods"""

  def setUp(self):
    self.client = authenticated_client()
    self.user = {
      "student_id": "2024-01072",
      "password": "JMC090907",
      "first_name": "Jemima Anne Marie",
      "middle_name": "Jurlano",
      "last_name": "Bontia",
      "email": "JemimaBontia@gmail.com",
      "program": "Bachelor of Science in Business Administration",
      "year_level": 1,
      "section": "BSBA-1D",
      "points": 2,
      "role": "admin"
    }
    self.bulk_user = [{
      "student_id": f"2024-{i:05d}",
      "password": "JMC090907",
      "first_name": f"Employee {i}",
      "middle_name": f"Middle {i}",
      "last_name": f"Last {i}",
      "email": f"employee{i}@gmail.com",
      "program": "Bachelor of Science in Business Administration",
      "year_level": 1 if i % 5 == 0 else i % 5,
      "section": "BSBA-1D",
      "points": 2,
      "role": "admin"
      } for i in range(1, 101)]

  def test_create_user(self):

    response = self.client.post("/api/user/register", self.user, format="json")

    self.assertTrue(
      User.objects.filter(student_id="2024-01072").exists()
    )

    self.assertEqual(response.status_code, 201)
    self.assertEqual(response.data["first_name"], "Jemima Anne Marie")
    self.assertEqual(response.data["middle_name"], "Jurlano")
    self.assertEqual(response.data["last_name"], "Bontia")
    self.assertEqual(response.data["email"], "JemimaBontia@gmail.com")
    self.assertEqual(response.data["program"], "Bachelor of Science in Business Administration")
    self.assertEqual(response.data["year_level"], 1)
    self.assertEqual(response.data["section"], "BSBA-1D")
    self.assertEqual(response.data["points"], 2)
    self.assertEqual(response.data["role"], "admin")
    self.assertTrue(User.objects.get(student_id="2024-01072").check_password("JMC090907"))
    self.assertFalse(User.objects.get(student_id="2024-01072").check_password("JMC090907!!!"))


  def test_create_user_exceed_year(self):
    self.user["year_level"] = 5
    response = self.client.post("/api/user/register", self.user, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(
      response.data["year_level"][0],
      "Year level must not exceed 4"
    )

  def test_create_user_below_year(self):
    self.user["year_level"] = 0

    response = self.client.post("/api/user/register", self.user, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(
      response.data["year_level"][0],
      "Year level must not be below 1"
    )

  def test_create_user_bulk(self):
    response = self.client.post("/api/user/bulk", self.bulk_user, format="json")
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(User.objects.filter(role="admin").exclude(student_id="staff-admin").count(), 100)

  def test_delete_user(self):
    self.client.post("/api/user/bulk", self.bulk_user, format="json")
    response = self.client.delete("/api/user/2024-00003")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertFalse(User.objects.filter(student_id="2024-00003").exists())
    self.assertEqual(User.objects.count(), 100)

  def test_patch_user(self):
    self.client.post("/api/user/register", self.user, format="json")
    patch_info = {
      "first_name" : "Emma",
      "year_level" : 3
    }
    response = self.client.patch("/api/user/2024-01072", patch_info)
    user_db = User.objects.get(student_id="2024-01072")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(user_db.first_name, "Emma")
    self.assertEqual(user_db.year_level, 3)

  def test_patch_user_invalid_input(self):
    self.client.post("/api/user/register", self.user, format="json")
    patch_info = {
      "first_name" : "Emma",
      "year_level" : 5
    }
    response = self.client.patch("/api/user/2024-01072", patch_info)
    user_db = User.objects.get(student_id="2024-01072")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(response.data["year_level"][0], "Year level must not exceed 4")
    self.assertEqual(user_db.first_name, "Jemima Anne Marie")

  def test_create_user_bulk_hashes_passwords(self):
    self.client.post("/api/user/bulk", self.bulk_user, format="json")
    user = User.objects.get(student_id="2024-00001")
    self.assertNotEqual(user.password, "JMC090907")
    self.assertTrue(user.check_password("JMC090907"))

  def test_create_user_bulk_rejects_non_list(self):
    response = self.client.post("/api/user/bulk", self.user, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(User.objects.count(), 1)

  def test_create_user_bulk_rejects_duplicate_ids(self):
    response = self.client.post("/api/user/bulk", [self.user, self.user], format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(User.objects.count(), 1)

  def test_create_user_bulk_rejects_invalid_item(self):
    self.bulk_user[10]["year_level"] = 9
    response = self.client.post("/api/user/bulk", self.bulk_user, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(User.objects.count(), 1)

  def test_password_not_returned(self):
    response = self.client.post("/api/user/register", self.user, format="json")
    self.assertNotIn("password", response.data)

  def test_list_users(self):
    self.client.post("/api/user/bulk", self.bulk_user, format="json")
    response = self.client.get("/api/user")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 101)

  def test_list_users_filter_by_year_level(self):
    self.client.post("/api/user/bulk", self.bulk_user, format="json")
    response = self.client.get("/api/user", {"year_level": 2})
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 20)
    self.assertTrue(all(user["year_level"] == 2 for user in response.data))

  def test_list_users_search(self):
    self.client.post("/api/user/bulk", self.bulk_user, format="json")
    response = self.client.get("/api/user", {"search": "Employee 42"})
    self.assertEqual([user["student_id"] for user in response.data], ["2024-00042"])
    response = self.client.get("/api/user", {"search": "2024-0001"})
    self.assertEqual(len(response.data), 10)

  def test_get_user(self):
    self.client.post("/api/user/register", self.user, format="json")
    response = self.client.get("/api/user/2024-01072")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["student_id"], "2024-01072")
    self.assertEqual(response.data["last_name"], "Bontia")

  def test_get_user_not_found(self):
    response = self.client.get("/api/user/0000-00000")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_delete_user_not_found(self):
    response = self.client.delete("/api/user/0000-00000")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_patch_user_password_is_hashed(self):
    self.client.post("/api/user/register", self.user, format="json")
    response = self.client.patch("/api/user/2024-01072", {"password": "NewPass123"}, format="json")
    user_db = User.objects.get(student_id="2024-01072")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertTrue(user_db.check_password("NewPass123"))
    self.assertFalse(user_db.check_password("JMC090907"))


class UserSerializerTest(TestCase):

  def test_year_level_bounds(self):
    for year_level, valid in [(0, False), (1, True), (4, True), (5, False)]:
      serializer = UserSerializer(data={
        "student_id": f"2024-0000{year_level}",
        "password": "JMC090907",
        "first_name": "A",
        "last_name": "B",
        "email": "a@b.com",
        "program": "BSIT",
        "year_level": year_level,
        "section": "A",
        "points": 0,
        "role": "student",
      })
      self.assertEqual(serializer.is_valid(), valid, year_level)

  def test_required_fields(self):
    serializer = UserSerializer(data={})
    self.assertFalse(serializer.is_valid())
    self.assertIn("student_id", serializer.errors)
    self.assertIn("first_name", serializer.errors)
    # roster imports come without a login, so a password is optional
    self.assertNotIn("password", serializer.errors)


class EventSerializerTest(TestCase):

  def test_valid_event(self):
    serializer = EventSerializer(data={"title": "Assembly", "program_for": ["BSIT", "BSCS"]})
    self.assertTrue(serializer.is_valid(), serializer.errors)
    self.assertEqual(serializer.validated_data["program_for"], ["BSIT", "BSCS"])

  def test_blank_title(self):
    serializer = EventSerializer(data={"title": "   "})
    self.assertFalse(serializer.is_valid())
    self.assertIn("title", serializer.errors)

  def test_program_for_must_be_list(self):
    serializer = EventSerializer(data={"title": "Assembly", "program_for": "BSIT"})
    self.assertFalse(serializer.is_valid())
    self.assertEqual(serializer.errors["program_for"][0], "The programs for must be type list")

  def test_program_for_items_must_be_strings(self):
    serializer = EventSerializer(data={"title": "Assembly", "program_for": ["BSIT", 3]})
    self.assertFalse(serializer.is_valid())
    self.assertIn("program_for", serializer.errors)

  def test_negative_default_points(self):
    serializer = EventSerializer(data={"title": "Assembly", "default_points": -1})
    self.assertFalse(serializer.is_valid())
    self.assertIn("default_points", serializer.errors)

  def test_read_only_fields_ignored(self):
    serializer = EventSerializer(data={
      "title": "Assembly",
      "event_id": "00000000-0000-0000-0000-000000000000",
    })
    self.assertTrue(serializer.is_valid(), serializer.errors)
    self.assertNotIn("event_id", serializer.validated_data)


class AttendanceSerializerTest(TestCase):

  def setUp(self):
    self.user = make_user()
    self.event = Event.objects.create_event(title="Assembly", date="2026-07-13", default_points=5)

  def test_defaults_points_to_event(self):
    serializer = AttendanceSerializer(data={"user": self.user.pk, "event": str(self.event.pk)})
    self.assertTrue(serializer.is_valid(), serializer.errors)
    attendance = serializer.save()
    self.assertEqual(attendance.points_awarded, 5)

  def test_requires_user_and_event(self):
    serializer = AttendanceSerializer(data={})
    self.assertFalse(serializer.is_valid())
    self.assertIn("user", serializer.errors)
    self.assertIn("event", serializer.errors)

  def test_negative_points_rejected(self):
    serializer = AttendanceSerializer(data={"user": self.user.pk, "event": str(self.event.pk), "points_awarded": -3})
    self.assertFalse(serializer.is_valid())
    self.assertIn("points_awarded", serializer.errors)


class EventViewTest(TestCase):

  def setUp(self):
    self.user = make_user(role="admin")
    # created_by comes from whoever is signed in
    self.client = authenticated_client(self.user)

    self.event = {
      "title": "General Assembly",
      "description":
      """
        First Semester Assembly of Tech Students

        Venue: ECC
        Attire: Regular Uniform
      """,
      "category": "assembly",
      "date": "2026-07-13",
      "default_points": 10,
      "program_for": ["BSIT", "BSCS"],
      "created_by": self.user.pk,
    }

  def create_event(self, **overrides):
    return self.client.post("/api/event", {**self.event, **overrides}, format="json")

  def test_create_event(self):
    response = self.create_event()
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(Event.objects.count(), 1)
    self.assertEqual(response.data["title"], "General Assembly")
    self.assertEqual(response.data["default_points"], 10)
    self.assertEqual(response.data["program_for"], ["BSIT", "BSCS"])
    self.assertEqual(response.data["created_by"], self.user.pk)
    self.assertIn("event_id", response.data)

  def test_create_event_without_title(self):
    response = self.create_event(title="")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("title", response.data)
    self.assertEqual(Event.objects.count(), 0)

  def test_create_event_invalid_program_for(self):
    response = self.create_event(program_for="BSIT")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("program_for", response.data)

  def test_create_event_bulk(self):
    events = [{**self.event, "title": f"Event {i}"} for i in range(5)]
    response = self.client.post("/api/event", events, format="json")
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(Event.objects.count(), 5)

  def test_list_events(self):
    self.create_event()
    self.create_event(title="Seminar", category="seminar")
    response = self.client.get("/api/event")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 2)

  def test_list_events_filter_by_category(self):
    self.create_event()
    self.create_event(title="Seminar", category="seminar")
    response = self.client.get("/api/event", {"category": "seminar"})
    self.assertEqual(len(response.data), 1)
    self.assertEqual(response.data[0]["title"], "Seminar")

  def test_retrieve_event(self):
    event_id = self.create_event().data["event_id"]
    response = self.client.get(f"/api/event/{event_id}")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["title"], "General Assembly")

  def test_retrieve_event_not_found(self):
    response = self.client.get("/api/event/00000000-0000-0000-0000-000000000000")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_patch_event(self):
    event_id = self.create_event().data["event_id"]
    response = self.client.patch(f"/api/event/{event_id}", {"title": "Renamed", "default_points": 3}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    event = Event.objects.get(event_id=event_id)
    self.assertEqual(event.title, "Renamed")
    self.assertEqual(event.default_points, 3)

  def test_delete_event(self):
    event_id = self.create_event().data["event_id"]
    response = self.client.delete(f"/api/event/{event_id}")
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.assertEqual(Event.objects.count(), 0)

  def test_event_str(self):
    event_id = self.create_event().data["event_id"]
    event = Event.objects.get(event_id=event_id)
    self.assertEqual(str(event), "General Assembly by Jemima Anne Marie Bontia")
    self.assertEqual(str(Event(title="Orphan")), "Orphan")


class AttendanceViewTest(TestCase):

  def setUp(self):
    self.client = authenticated_client()
    self.student = make_user("2024-00001", points=0)
    self.other_student = make_user("2024-00002", points=0)
    self.scanner = make_user("2024-00003", role="scanner")
    self.event = Event.objects.create_event(title="Assembly", date="2026-07-13", default_points=10)
    self.other_event = Event.objects.create_event(title="Seminar", date="2026-07-14", default_points=4)

  def record(self, user=None, event=None, **extra):
    data = {
      "user": (user or self.student).pk,
      "event": str((event or self.event).pk),
      "scanned_by": self.scanner.pk,
      **extra,
    }
    return self.client.post("/api/attendance", data, format="json")

  def points(self, user):
    user.refresh_from_db()
    return user.points

  def test_record_attendance_uses_default_points(self):
    response = self.record()
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(response.data["points_awarded"], 10)
    self.assertEqual(response.data["scanned_by"], self.scanner.pk)
    self.assertEqual(self.points(self.student), 10)

  def test_record_attendance_custom_points(self):
    response = self.record(points_awarded=25)
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(response.data["points_awarded"], 25)
    self.assertEqual(self.points(self.student), 25)

  def test_record_attendance_zero_points_kept(self):
    response = self.record(points_awarded=0)
    self.assertEqual(response.data["points_awarded"], 0)
    self.assertEqual(self.points(self.student), 0)

  def test_duplicate_attendance_rejected(self):
    self.record()
    response = self.record()
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(Attendance.objects.count(), 1)
    self.assertEqual(self.points(self.student), 10)

  def test_attendance_unknown_event(self):
    response = self.client.post("/api/attendance", {
      "user": self.student.pk,
      "event": "00000000-0000-0000-0000-000000000000",
    }, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("event", response.data)

  def test_list_attendance_filters(self):
    self.record()
    self.record(event=self.other_event)
    self.record(user=self.other_student)

    self.assertEqual(len(self.client.get("/api/attendance").data), 3)
    self.assertEqual(len(self.client.get("/api/attendance", {"event": str(self.event.pk)}).data), 2)
    self.assertEqual(len(self.client.get("/api/attendance", {"user": self.student.pk}).data), 2)
    self.assertEqual(len(self.client.get("/api/attendance", {
      "user": self.other_student.pk,
      "event": str(self.event.pk),
    }).data), 1)

  def test_retrieve_attendance(self):
    attendance_id = self.record().data["attendance_id"]
    response = self.client.get(f"/api/attendance/{attendance_id}")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["user"], self.student.pk)

  def test_patch_attendance_adjusts_points(self):
    attendance_id = self.record().data["attendance_id"]
    response = self.client.patch(f"/api/attendance/{attendance_id}", {"points_awarded": 3}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self.points(self.student), 3)

  def test_patch_attendance_change_user_moves_points(self):
    attendance_id = self.record().data["attendance_id"]
    response = self.client.patch(f"/api/attendance/{attendance_id}", {"user": self.other_student.pk}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self.points(self.student), 0)
    self.assertEqual(self.points(self.other_student), 10)

  def test_patch_attendance_into_duplicate_rejected(self):
    self.record()
    attendance_id = self.record(event=self.other_event).data["attendance_id"]
    response = self.client.patch(f"/api/attendance/{attendance_id}", {"event": str(self.event.pk)}, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_delete_attendance_removes_points(self):
    attendance_id = self.record().data["attendance_id"]
    response = self.client.delete(f"/api/attendance/{attendance_id}")
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.assertEqual(Attendance.objects.count(), 0)
    self.assertEqual(self.points(self.student), 0)


class NotificationViewTest(TestCase):

  def setUp(self):
    self.client = authenticated_client()
    self.user = make_user("2024-00001")
    self.other_user = make_user("2024-00002")

  def notify(self, user=None, **extra):
    data = {"user": (user or self.user).pk, "message": "Assembly tomorrow", **extra}
    return self.client.post("/api/notification", data, format="json")

  def test_create_notification(self):
    response = self.notify(notification_type="SYSTEM")
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(response.data["notification_type"], "SYSTEM")
    self.assertFalse(response.data["read_status"])

  def test_create_notification_default_type(self):
    response = self.notify()
    self.assertEqual(response.data["notification_type"], "REMINDER")

  def test_create_notification_invalid_type(self):
    response = self.notify(notification_type="SPAM")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("notification_type", response.data)

  def test_create_notification_blank_message(self):
    response = self.notify(message="  ")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("message", response.data)

  def test_list_notifications_filters(self):
    self.notify()
    self.notify(read_status=True)
    self.notify(user=self.other_user)

    self.assertEqual(len(self.client.get("/api/notification").data), 3)
    self.assertEqual(len(self.client.get("/api/notification", {"user": self.user.pk}).data), 2)
    self.assertEqual(len(self.client.get("/api/notification", {"user": self.user.pk, "read_status": "false"}).data), 1)

  def test_mark_notification_read(self):
    notification_id = self.notify().data["notification_id"]
    response = self.client.patch(f"/api/notification/{notification_id}", {"read_status": True}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertTrue(Notification.objects.get(notification_id=notification_id).read_status)

  def test_mark_all_notifications_read(self):
    self.notify()
    self.notify()
    self.notify(user=self.other_user)
    response = self.client.post(f"/api/user/{self.user.pk}/notifications/read")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(Notification.objects.filter(user=self.user, read_status=False).count(), 0)
    self.assertEqual(Notification.objects.filter(user=self.other_user, read_status=False).count(), 1)

  def test_mark_all_notifications_read_unknown_user(self):
    response = self.client.post("/api/user/0000-00000/notifications/read")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_delete_notification(self):
    notification_id = self.notify().data["notification_id"]
    response = self.client.delete(f"/api/notification/{notification_id}")
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.assertEqual(Notification.objects.count(), 0)

  def test_notification_manager(self):
    notification = Notification.objects.create_notification("Hello", user=self.user)
    self.assertEqual(notification.message, "Hello")
    with self.assertRaises(ValueError):
      Notification.objects.create_notification("")


class SubmissionLogViewTest(TestCase):

  def setUp(self):
    self.client = authenticated_client()
    self.student = make_user("2024-00001")
    self.admin = make_user("2024-00002", role="admin")
    event = Event.objects.create_event(title="Assembly", date="2026-07-13", default_points=10)
    self.attendance = Attendance.objects.create(user=self.student, event=event, points_awarded=10)

  def log(self, **extra):
    data = {
      "activity": str(self.attendance.pk),
      "admin": self.admin.pk,
      "action": "APPROVED",
      "remarks": "Looks good",
      **extra,
    }
    return self.client.post("/api/log", data, format="json")

  def test_create_log(self):
    response = self.log()
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(response.data["action"], "APPROVED")
    self.assertEqual(response.data["admin"], self.admin.pk)
    self.assertIn("timestamp", response.data)

  def test_create_log_invalid_action(self):
    response = self.log(action="DELETED")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("action", response.data)

  def test_list_logs_filters(self):
    self.log()
    self.log(action="REJECTED")
    self.assertEqual(len(self.client.get("/api/log").data), 2)
    self.assertEqual(len(self.client.get("/api/log", {"action": "REJECTED"}).data), 1)
    self.assertEqual(len(self.client.get("/api/log", {"activity": str(self.attendance.pk)}).data), 2)

  def test_patch_log(self):
    log_id = self.log().data["log_id"]
    response = self.client.patch(f"/api/log/{log_id}", {"remarks": "Updated"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(SubmissionLog.objects.get(log_id=log_id).remarks, "Updated")

  def test_delete_log(self):
    log_id = self.log().data["log_id"]
    response = self.client.delete(f"/api/log/{log_id}")
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.assertEqual(SubmissionLog.objects.count(), 0)


class LoginViewTest(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.student = make_user("2024-00001", email="Student@School.edu")
    self.scanner = staff_user("scanner")

  def login(self, identifier, password, portal):
    return self.client.post("/api/auth/login", {"identifier": identifier, "password": password, "portal": portal}, format="json")

  def test_student_logs_in_with_email(self):
    response = self.login("student@school.edu", "JMC090907", "student")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["user"]["student_id"], "2024-00001")
    self.assertIn("access", response.data)

  def test_student_logs_in_with_student_id(self):
    self.assertEqual(self.login("2024-00001", "JMC090907", "student").status_code, status.HTTP_200_OK)

  def test_staff_logs_in_with_username(self):
    response = self.login("STAFF-SCANNER", "StaffPass1", "staff")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["user"]["role"], "scanner")

  def test_portals_are_separate(self):
    self.assertEqual(self.login("2024-00001", "JMC090907", "staff").status_code, status.HTTP_401_UNAUTHORIZED)
    self.assertEqual(self.login("staff-scanner", "StaffPass1", "student").status_code, status.HTTP_401_UNAUTHORIZED)

  def test_wrong_password(self):
    self.assertEqual(self.login("2024-00001", "nope", "student").status_code, status.HTTP_401_UNAUTHORIZED)

  def test_student_without_account_cannot_log_in(self):
    User.objects.create_user("2024-00002", None, first_name="No", last_name="Login", email="none@school.edu")
    self.assertEqual(self.login("none@school.edu", "anything", "student").status_code, status.HTTP_401_UNAUTHORIZED)

  def test_refresh_token_of_deleted_user_is_rejected(self):
    refresh = self.login("2024-00001", "JMC090907", "student").data["refresh"]
    self.student.delete()
    response = APIClient().post("/api/token/refresh", {"refresh": refresh}, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RolePermissionTest(TestCase):

  def setUp(self):
    self.student = make_user("2024-00001")
    self.client = authenticated_client(self.student)
    self.scanner_client = authenticated_client(staff_user("scanner"))

  def test_student_cannot_manage_roster(self):
    self.assertEqual(self.client.get("/api/user").status_code, status.HTTP_403_FORBIDDEN)
    self.assertEqual(self.client.get("/api/user/2024-00001").status_code, status.HTTP_403_FORBIDDEN)
    self.assertEqual(self.client.delete("/api/user/2024-00001").status_code, status.HTTP_403_FORBIDDEN)
    self.assertEqual(self.client.post("/api/user/register", {}, format="json").status_code, status.HTTP_403_FORBIDDEN)

  def test_student_can_read_but_not_write_events(self):
    self.assertEqual(self.client.get("/api/event").status_code, status.HTTP_200_OK)
    response = self.client.post("/api/event", {"title": "Party", "date": "2026-07-13"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  def test_scanner_can_create_events_but_not_edit_students(self):
    response = self.scanner_client.post("/api/event", {"title": "Party", "date": "2026-07-13"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(self.scanner_client.get("/api/user").status_code, status.HTTP_200_OK)
    response = self.scanner_client.patch("/api/user/2024-00001", {"first_name": "X"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  def test_student_sees_only_own_attendance_and_notifications(self):
    other = make_user("2024-00002")
    event = Event.objects.create_event(title="Assembly", date="2026-07-13")
    Attendance.objects.create(user=self.student, event=event)
    Attendance.objects.create(user=other, event=event)
    Notification.objects.create_notification("Mine", user=self.student)
    Notification.objects.create_notification("Theirs", user=other)

    attendance = self.client.get("/api/attendance", {"user": other.pk}).data
    self.assertEqual([a["user"] for a in attendance], [self.student.pk])
    notifications = self.client.get("/api/notification").data
    self.assertEqual([n["message"] for n in notifications], ["Mine"])

  def test_student_can_only_mark_own_notification_read(self):
    mine = Notification.objects.create_notification("Mine", user=self.student)
    theirs = Notification.objects.create_notification("Theirs", user=make_user("2024-00002"))

    response = self.client.patch(f"/api/notification/{mine.pk}", {"read_status": True}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    response = self.client.patch(f"/api/notification/{mine.pk}", {"message": "edited"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    response = self.client.patch(f"/api/notification/{theirs.pk}", {"read_status": True}, format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class CurrentUserTest(TestCase):

  def setUp(self):
    self.student = make_user("2024-00001")
    self.client = authenticated_client(self.student)

  def test_update_own_profile_only_changes_profile_fields(self):
    response = self.client.patch("/api/user/me", {
      "bio": "Hello", "hobbies": ["Coding"], "talent": "Singing", "role": "admin", "points": 999,
    }, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.student.refresh_from_db()
    self.assertEqual(self.student.bio, "Hello")
    self.assertEqual(self.student.hobbies, ["Coding"])
    self.assertEqual(self.student.role, "student")
    self.assertEqual(self.student.points, 0)

  def test_photo_size_limit(self):
    response = self.client.patch("/api/user/me", {"photo": "x" * 200_001}, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_change_password_clears_temp_password(self):
    self.student.must_change_password = True
    self.student.temp_password = "JMC090907"
    self.student.save()

    response = self.client.post("/api/user/me/password", {"current_password": "JMC090907", "new_password": "BrandNew123"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.student.refresh_from_db()
    self.assertTrue(self.student.check_password("BrandNew123"))
    self.assertFalse(self.student.must_change_password)
    self.assertEqual(self.student.temp_password, "")

  def test_change_password_wrong_current(self):
    response = self.client.post("/api/user/me/password", {"current_password": "bad", "new_password": "BrandNew123"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("current_password", response.data)

  def test_presence_heartbeat(self):
    response = self.client.post("/api/user/me/presence", {"online": True}, format="json")
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.student.refresh_from_db()
    self.assertTrue(self.student.online)
    self.assertIsNotNone(self.student.last_seen)
    self.client.post("/api/user/me/presence", {"online": False}, format="json")
    self.student.refresh_from_db()
    self.assertFalse(self.student.online)


class AccountProvisioningTest(TestCase):

  def setUp(self):
    self.client = authenticated_client()
    self.student = User.objects.create_user("2024-00001", None, first_name="A", last_name="B", email="a@school.edu")

  def test_issue_temp_password(self):
    self.assertFalse(self.client.get("/api/user/2024-00001").data["has_account"])
    response = self.client.post("/api/user/2024-00001/account")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    temp_password = response.data["temp_password"]

    self.student.refresh_from_db()
    self.assertTrue(self.student.check_password(temp_password))
    self.assertTrue(self.student.must_change_password)
    self.assertTrue(self.client.get("/api/user/2024-00001").data["has_account"])
    self.assertEqual(self.client.get("/api/user/2024-00001/account").data["temp_password"], temp_password)
    self.assertNotIn("temp_password", self.client.get("/api/user/2024-00001").data)

  def test_reissue_replaces_password(self):
    first = self.client.post("/api/user/2024-00001/account").data["temp_password"]
    second = self.client.post("/api/user/2024-00001/account").data["temp_password"]
    self.student.refresh_from_db()
    self.assertFalse(self.student.check_password(first))
    self.assertTrue(self.student.check_password(second))

  def test_requires_email(self):
    User.objects.filter(pk="2024-00001").update(email="")
    response = self.client.post("/api/user/2024-00001/account")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_temp_password_hidden_after_student_changes_it(self):
    self.client.post("/api/user/2024-00001/account")
    User.objects.filter(pk="2024-00001").update(must_change_password=False, temp_password="")
    self.assertIsNone(self.client.get("/api/user/2024-00001/account").data["temp_password"])

  def test_only_admin_can_issue(self):
    scanner = authenticated_client(staff_user("scanner"))
    self.assertEqual(scanner.post("/api/user/2024-00001/account").status_code, status.HTTP_403_FORBIDDEN)

  def test_password_request_flow(self):
    anonymous = APIClient()
    response = anonymous.post("/api/auth/password-request", {"student_id": "2024-00001"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIsNotNone(self.client.get("/api/user/2024-00001").data["password_requested_at"])

    # unknown IDs get the same answer, so the endpoint can't be used to probe the roster
    response = anonymous.post("/api/auth/password-request", {"student_id": "9999-99999"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)

    self.client.post("/api/user/2024-00001/account")
    self.assertIsNone(self.client.get("/api/user/2024-00001").data["password_requested_at"])

  def test_dismiss_password_request(self):
    User.objects.filter(pk="2024-00001").update(password_requested_at="2026-01-01T00:00:00Z")
    response = self.client.delete("/api/user/2024-00001/password-request")
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.assertIsNone(User.objects.get(pk="2024-00001").password_requested_at)

  def test_bulk_delete_removes_related_records(self):
    event = Event.objects.create_event(title="Assembly", date="2026-07-13")
    Attendance.objects.create(user=self.student, event=event)
    make_user("2024-00002")
    response = self.client.post("/api/user/bulk-delete", {"student_ids": ["2024-00001", "2024-00002"]}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertFalse(User.objects.filter(pk__in=["2024-00001", "2024-00002"]).exists())
    self.assertEqual(Attendance.objects.count(), 0)


class ScanAndAnnounceTest(TestCase):

  def setUp(self):
    self.scanner = staff_user("scanner")
    self.client = authenticated_client(self.scanner)
    self.cpe = make_user("2024-00001", program="BS Computer Engineering")
    self.cs = make_user("2024-00002", program="BS Computer Science")
    self.event = Event.objects.create_event(title="Assembly", date="2026-07-13", default_points=7)

  def scan(self, student):
    return self.client.post("/api/attendance/scan", {"event": str(self.event.pk), "user": student.pk}, format="json")

  def test_scan_in_out_already(self):
    first = self.scan(self.cpe)
    self.assertEqual(first.data["action"], "in")
    self.assertEqual(first.data["record"]["points_awarded"], 7)
    self.assertEqual(first.data["record"]["scanned_by"], self.scanner.pk)
    self.assertIsNone(first.data["record"]["time_out"])

    second = self.scan(self.cpe)
    self.assertEqual(second.data["action"], "out")
    self.assertIsNotNone(second.data["record"]["time_out"])

    self.assertEqual(self.scan(self.cpe).data["action"], "already")
    self.assertEqual(Attendance.objects.count(), 1)
    self.cpe.refresh_from_db()
    self.assertEqual(self.cpe.points, 7)

  def test_scan_unknown_student(self):
    response = self.client.post("/api/attendance/scan", {"event": str(self.event.pk), "user": "nope"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_announce_to_everyone(self):
    response = self.client.post(f"/api/event/{self.event.pk}/announce", {"kind": "new"}, format="json")
    self.assertEqual(response.data["notified"], 2)
    notification = Notification.objects.filter(user=self.cpe).get()
    self.assertEqual(notification.kind, "new")
    self.assertEqual(notification.event, self.event)
    self.event.refresh_from_db()
    self.assertIsNotNone(self.event.last_notified_at)

  def test_announce_only_to_program(self):
    Event.objects.filter(pk=self.event.pk).update(program_for=["BS Computer Science"])
    response = self.client.post(f"/api/event/{self.event.pk}/announce", {"kind": "reminder", "message": "Tomorrow!"}, format="json")
    self.assertEqual(response.data["notified"], 1)
    self.assertEqual(Notification.objects.get().user, self.cs)
    self.assertEqual(Notification.objects.get().message, "Tomorrow!")

  def test_announce_invalid_kind(self):
    response = self.client.post(f"/api/event/{self.event.pk}/announce", {"kind": "spam"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_notification_includes_event_date(self):
    self.client.post(f"/api/event/{self.event.pk}/announce", {"kind": "new"}, format="json")
    data = authenticated_client(self.cpe).get("/api/notification").data[0]
    self.assertEqual(data["event_date"], "2026-07-13")
    self.assertEqual(data["event"], self.event.pk)

  def test_deleting_event_takes_back_points(self):
    self.scan(self.cpe)
    admin = authenticated_client()
    self.assertEqual(admin.delete(f"/api/event/{self.event.pk}").status_code, status.HTTP_204_NO_CONTENT)
    self.cpe.refresh_from_db()
    self.assertEqual(self.cpe.points, 0)


class RequirementTest(TestCase):

  def setUp(self):
    self.client = authenticated_client()
    self.student = make_user("2024-00001")

  def create(self, **data):
    return self.client.post("/api/requirement", {"title": "Lanyard", "point_value": 10, **data}, format="json")

  def toggle(self, requirement_id):
    return self.client.post("/api/requirement/completion/toggle", {"student": "2024-00001", "requirement": requirement_id}, format="json")

  def test_create_and_list(self):
    response = self.create(program_filter="BS Computer Science")
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(response.data["program_filter"], "BS Computer Science")
    self.assertEqual(len(authenticated_client(self.student).get("/api/requirement").data), 1)

  def test_duplicate_title_rejected(self):
    self.create()
    response = self.create(title="lanyard")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("title", response.data)

  def test_rename_to_own_title_allowed(self):
    requirement_id = self.create().data["requirement_id"]
    response = self.client.patch(f"/api/requirement/{requirement_id}", {"title": "Lanyard", "point_value": 5}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_student_cannot_create(self):
    response = authenticated_client(self.student).post("/api/requirement", {"title": "X"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  def test_toggle_completion(self):
    requirement_id = self.create().data["requirement_id"]

    self.assertTrue(self.toggle(requirement_id).data["completed"])
    student_view = authenticated_client(self.student).get("/api/requirement/completion").data
    self.assertEqual([str(c["requirement"]) for c in student_view], [requirement_id])

    self.assertFalse(self.toggle(requirement_id).data["completed"])
    self.assertEqual(RequirementCompletion.objects.count(), 0)

  def test_deleting_requirement_removes_completions(self):
    requirement_id = self.create().data["requirement_id"]
    self.toggle(requirement_id)
    self.client.delete(f"/api/requirement/{requirement_id}")
    self.assertEqual(RequirementCompletion.objects.count(), 0)

  def test_hobbies(self):
    self.assertEqual(self.client.post("/api/hobby", {"label": "Chess"}, format="json").status_code, status.HTTP_201_CREATED)
    labels = [h["label"] for h in authenticated_client(self.student).get("/api/hobby").data]
    self.assertEqual(labels, ["Chess"])


class SeedCommandTest(TestCase):

  def test_seed_is_idempotent(self):
    call_command("seed_oasis", stdout=StringIO())
    call_command("seed_oasis", stdout=StringIO())
    self.assertEqual(User.objects.filter(role="admin").count(), 1)
    self.assertEqual(User.objects.filter(role="student").count(), 6)
    self.assertFalse(User.objects.get(pk="2024-02333").has_usable_password())
    self.assertEqual(Requirement.objects.count(), 3)
    self.assertEqual(Event.objects.count(), 1)
