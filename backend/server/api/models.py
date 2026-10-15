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
  last_name = models.CharField(max_length=50)
  email = models.EmailField()

  program = models.CharField(max_length=50)
  year_level = models.IntegerField()
  section = models.CharField(max_length=10)
  points = models.IntegerField()

  role = models.CharField(max_length=20)

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
    print("Event manager used")
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
  title = models.CharField(max_length=50)
  description = models.TextField(default='', blank=True, null=True)
  category = models.CharField(max_length=20, default='', blank=True, null=True)
  date = models.DateTimeField(default=timezone.now)
  default_points = models.IntegerField(default=0)
  program_for = models.JSONField(default=list)
  created_by = models.ForeignKey(
    User,
    null=True, 
    on_delete=models.CASCADE, 
    related_name='events'
  )
  
  created_at = models.DateTimeField(default=timezone.now)

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
  message = models.TextField(default='')
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


