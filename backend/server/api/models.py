from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
import uuid
from django.utils import timezone
from .utils import UserRole, UserStatus, generateQrToken, ActivityStatus, NotificationType, SubmissionLogAction


class UserManager(BaseUserManager):

    def create_user(self, student_id, password=None, **extra_fields):
        if not student_id:
            raise ValueError("Student ID is required")

        user = self.model(
            student_id=student_id,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, student_id, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.ADMIN.value)
        extra_fields.setdefault("year_level", 1)
        extra_fields.setdefault("points", 0)
        return self.create_user(student_id, password, **extra_fields)

class User(AbstractBaseUser):
  USERNAME_FIELD = "student_id"
  REQUIRED_FIELDS = ["first_name", "last_name", "email"]

  student_id = models.CharField(
    primary_key=True
  )

  first_name = models.CharField(max_length=50)
  middle_name = models.CharField(max_length=50, blank=True)
  last_name = models.CharField(max_length=50, blank=True)
  email = models.EmailField(blank=True)

  program = models.CharField(max_length=100, blank=True)
  year_level = models.IntegerField(default=1)
  section = models.CharField(max_length=20, blank=True)
  points = models.IntegerField(default=0)

  role = models.CharField(max_length=20, default=UserRole.STUDENT.value)
  status = models.CharField(max_length=10, default="ACTIVE")

  contact_number = models.CharField(max_length=30, blank=True)
  address = models.CharField(max_length=255, blank=True)

  # profile fields the student edits on the user site
  bio = models.TextField(blank=True)
  hobbies = models.JSONField(default=list, blank=True)
  talent = models.CharField(max_length=100, blank=True)
  photo = models.TextField(blank=True)

  # an admin-issued temporary password is kept (admin-only) until the student
  # replaces it with their own, which also clears must_change_password
  must_change_password = models.BooleanField(default=False)
  temp_password = models.CharField(max_length=64, blank=True)
  password_requested_at = models.DateTimeField(null=True, blank=True)

  # heartbeat from the user site, shown as online/offline on the admin site
  last_seen = models.DateTimeField(null=True, blank=True)
  online = models.BooleanField(default=False)
  # staff only: which site, page or kiosk event, and device (shown on the admin Settings page)
  presence_info = models.JSONField(default=dict, blank=True)
  # staff only: which site, page or kiosk event, and device (shown on the admin Settings page)
  presence_info = models.JSONField(default=dict, blank=True)

  objects = UserManager()

  # lets admins log into the Django admin site without a separate permissions table
  @property
  def is_staff(self):
    return self.role == UserRole.ADMIN

  @property
  def is_superuser(self):
    return self.role == UserRole.ADMIN

  def has_perm(self, perm, obj=None):
    return self.is_staff

  def has_module_perms(self, app_label):
    return self.is_staff

class EventManager(models.Manager):
  def create_event(self, title, date, **extra_fields):
    if not title:
      raise ValueError("Event must have a title")
    if not date:
      raise ValueError("Event must have a date")
    event = self.model(
      title=title, 
      date=date, 
      **extra_fields)
    event.save(using=self._db)
    return event

class Event(models.Model):
  event_id = models.UUIDField(default=uuid.uuid4, primary_key=True)
  title = models.CharField(max_length=100)
  description = models.TextField(default='', blank=True, null=True)
  category = models.CharField(max_length=20, default='', blank=True, null=True)
  date = models.DateField(default=timezone.localdate)
  default_points = models.IntegerField(default=0)
  program_for = models.JSONField(default=list, blank=True)
  image = models.TextField(blank=True)
  created_by = models.ForeignKey(
    User,
    null=True, 
    on_delete=models.SET_NULL, 
    related_name='events'
  )
  
  created_at = models.DateTimeField(default=timezone.now)
  last_notified_at = models.DateTimeField(null=True, blank=True)

  objects = EventManager()

  def __str__(self):
    if self.created_by is None:
      return self.title
    return f'{self.title} by {self.created_by.first_name} {self.created_by.last_name}'

class Attendance(models.Model):
  attendance_id = models.UUIDField(default=uuid.uuid4, primary_key=True)
  user = models.ForeignKey(
    User,
    null=True, 
    on_delete=models.CASCADE, 
    related_name='attendance'
    )
  event = models.ForeignKey(
    Event,
    null=True, 
    on_delete=models.CASCADE, 
    related_name='event'
    )
  scanned_by = models.ForeignKey(
    User,
    null=True, 
    on_delete=models.CASCADE, 
    related_name='attendance_scanner'
    )
  timestamp = models.DateTimeField(default=timezone.now)
  time_out = models.DateTimeField(null=True, blank=True)
  points_awarded = models.IntegerField(default=0)

class NotificationManager(models.Manager):
  def create_notification(self, message, **extra_fields):
    if not message:
      raise ValueError("Notification must have a message")
    notification = self.model(
      message=message,
      **extra_fields
    )
    notification.save(using=self._db)
    return notification

class Notification(models.Model):
  notification_id = models.UUIDField(default=uuid.uuid4, primary_key=True)
  title = models.CharField(max_length=100, blank=True)
  message = models.TextField(default='')
  kind = models.CharField(max_length=10, blank=True)
  event = models.ForeignKey(
    Event,
    null=True,
    blank=True,
    on_delete=models.CASCADE,
    related_name='notifications'
    )
  user = models.ForeignKey(
    User,
    null=True, 
    on_delete=models.CASCADE, 
    related_name='notification'
    )
  notification_type = models.CharField(
    max_length=8,
    choices=[(notification_type.name, notification_type.value) for notification_type in NotificationType],
    default=NotificationType.REMINDER.name
  )
  read_status = models.BooleanField(default=False)
  created_at = models.DateTimeField(default=timezone.now)

  objects = NotificationManager()

class SubmissionLog(models.Model):
  log_id = models.UUIDField(default=uuid.uuid4, primary_key=True)
  activity = models.ForeignKey(
    Attendance,
    null=True, 
    on_delete=models.CASCADE, 
    related_name='log_activity'
  )
  admin = models.ForeignKey(
    User,
    null=True, 
    on_delete=models.CASCADE, 
    related_name='log_action'
  )
  action = models.CharField(
    max_length=8,
    choices=[(action.name, action.value) for action in SubmissionLogAction],
    default=SubmissionLogAction.EDITED.name
  )
  remarks = models.TextField(default='')
  timestamp = models.DateField(default=timezone.localdate)


class Requirement(models.Model):
  requirement_id = models.UUIDField(default=uuid.uuid4, primary_key=True)
  title = models.CharField(max_length=100)
  point_value = models.IntegerField(default=0)
  program_filter = models.CharField(max_length=100, default="ALL")
  created_at = models.DateTimeField(default=timezone.now)

  def applies_to(self, program):
    return self.program_filter in ("", "ALL") or self.program_filter == program


class RequirementCompletion(models.Model):
  completion_id = models.UUIDField(default=uuid.uuid4, primary_key=True)
  student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requirement_completions')
  requirement = models.ForeignKey(Requirement, on_delete=models.CASCADE, related_name='completions')
  completed_at = models.DateTimeField(default=timezone.now)

  class Meta:
    constraints = [
      models.UniqueConstraint(fields=["student", "requirement"], name="unique_requirement_completion"),
    ]


class Hobby(models.Model):
  hobby_id = models.UUIDField(default=uuid.uuid4, primary_key=True)
  label = models.CharField(max_length=50, unique=True)

  def __str__(self):
    return self.label
