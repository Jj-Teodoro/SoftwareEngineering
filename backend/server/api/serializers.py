from django.db import transaction
from django.db.models import F
from rest_framework import serializers
from .models import User, Event, Attendance, Notification, SubmissionLog


class UserListSerializer(serializers.ListSerializer):
  MAX_BULK_SIZE = 500

  def validate(self, attr):
    if len(attr) > self.MAX_BULK_SIZE:
      raise serializers.ValidationError(f"cannot create users more than {self.MAX_BULK_SIZE} in a single request")

    student_ids = [user["student_id"] for user in attr]
    if len(student_ids) != len(set(student_ids)):
      raise serializers.ValidationError("Duplicate student IDs in request")
    return attr

  def create(self, validated_data):
    users = []
    for data in validated_data:
      password = data.pop("password", None)
      user = User(**data)
      user.set_password(password)
      users.append(user)

    return User.objects.bulk_create(users, batch_size=1000)


class UserSerializer(serializers.ModelSerializer):
  password = serializers.CharField(write_only=True)

  class Meta:
    model = User
    fields = "__all__"
    extra_kwargs = {"password": {"write_only": True}}
    list_serializer_class = UserListSerializer

  def validate_year_level(self, value):
    if value > 4:
      raise serializers.ValidationError("Year level must not exceed 4")
    if value < 1:
      raise serializers.ValidationError("Year level must not be below 1")
    return value

  def create(self, validated_data):
    user = User.objects.create_user(**validated_data)
    return user

  def update(self, instance, validated_data):
    password = validated_data.pop("password", None)
    user = super().update(instance, validated_data)
    if password:
      user.set_password(password)
      user.save(update_fields=["password"])
    return user


class EventSerializer(serializers.ModelSerializer):

  class Meta:
    model = Event
    fields = "__all__"
    read_only_fields = ["event_id", "created_at"]

  def validate_title(self, value):
    if not value or not value.strip():
      raise serializers.ValidationError("Title is required")
    return value

  def validate_default_points(self, value):
    if value < 0:
      raise serializers.ValidationError("Default points must not be negative")
    return value

  def validate_program_for(self, value):
    if not isinstance(value, list):
      raise serializers.ValidationError("The programs for must be type list")
    if not all(isinstance(program, str) for program in value):
      raise serializers.ValidationError("Each program must be a string")
    return value


class AttendanceSerializer(serializers.ModelSerializer):
  points_awarded = serializers.IntegerField(required=False, min_value=0)

  class Meta:
    model = Attendance
    fields = "__all__"
    read_only_fields = ["attendance_id", "timestamp"]
    extra_kwargs = {
      "user": {"required": True, "allow_null": False},
      "event": {"required": True, "allow_null": False},
    }

  def validate(self, attrs):
    user = attrs.get("user", getattr(self.instance, "user", None))
    event = attrs.get("event", getattr(self.instance, "event", None))

    duplicates = Attendance.objects.filter(user=user, event=event)
    if self.instance is not None:
      duplicates = duplicates.exclude(pk=self.instance.pk)
    if duplicates.exists():
      raise serializers.ValidationError("User already has attendance for this event")
    return attrs

  def create(self, validated_data):
    if validated_data.get("points_awarded") is None:
      validated_data["points_awarded"] = validated_data["event"].default_points

    with transaction.atomic():
      attendance = super().create(validated_data)
      User.objects.filter(pk=attendance.user_id).update(points=F("points") + attendance.points_awarded)
    return attendance

  def update(self, instance, validated_data):
    old_user_id = instance.user_id
    old_points = instance.points_awarded

    with transaction.atomic():
      attendance = super().update(instance, validated_data)
      User.objects.filter(pk=old_user_id).update(points=F("points") - old_points)
      User.objects.filter(pk=attendance.user_id).update(points=F("points") + attendance.points_awarded)
    return attendance


class NotificationSerializer(serializers.ModelSerializer):

  class Meta:
    model = Notification
    fields = "__all__"
    read_only_fields = ["notification_id", "created_at"]

  def validate_message(self, value):
    if not value or not value.strip():
      raise serializers.ValidationError("Notification must have a message")
    return value


class SubmissionLogSerializer(serializers.ModelSerializer):

  class Meta:
    model = SubmissionLog
    fields = "__all__"
    read_only_fields = ["log_id", "timestamp"]
