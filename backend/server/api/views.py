from django.db import transaction
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from .models import User, Event, Attendance, Notification, SubmissionLog
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
  UserSerializer,
  EventSerializer,
  AttendanceSerializer,
  NotificationSerializer,
  SubmissionLogSerializer,
)
from rest_framework.permissions import IsAuthenticated

# Create your views here.

class CreateUserView(generics.CreateAPIView):
  queryset = User.objects.all()
  serializer_class = UserSerializer
  permission_classes = [IsAuthenticated]

class UserListView(generics.ListAPIView):
  serializer_class = UserSerializer
  permission_classes = [IsAuthenticated]

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

class UserDetailView(APIView):
  permission_classes = [IsAuthenticated]

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
    user.delete()
    return Response({
        "message": "User deleted successfully"
      },
      status=status.HTTP_200_OK
    )

class CreateUserBulkView(generics.CreateAPIView):
  queryset = User.objects.all()
  serializer_class = UserSerializer
  permission_classes = [IsAuthenticated]

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


class EventListCreateView(generics.ListCreateAPIView):
  serializer_class = EventSerializer
  permission_classes = [IsAuthenticated]

  def get_queryset(self):
    queryset = Event.objects.all().order_by("date")
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

class EventView(generics.RetrieveUpdateDestroyAPIView):
  queryset = Event.objects.all()
  serializer_class = EventSerializer
  permission_classes = [IsAuthenticated]
  lookup_field = "event_id"


class AttendanceListCreateView(generics.ListCreateAPIView):
  serializer_class = AttendanceSerializer
  permission_classes = [IsAuthenticated]

  def get_queryset(self):
    queryset = Attendance.objects.all().order_by("-timestamp")
    event = self.request.query_params.get("event")
    user = self.request.query_params.get("user")
    if event:
      queryset = queryset.filter(event_id=event)
    if user:
      queryset = queryset.filter(user_id=user)
    return queryset

class AttendanceView(generics.RetrieveUpdateDestroyAPIView):
  queryset = Attendance.objects.all()
  serializer_class = AttendanceSerializer
  permission_classes = [IsAuthenticated]
  lookup_field = "attendance_id"

  def perform_destroy(self, instance):
    # take back the points that were awarded for this attendance
    with transaction.atomic():
      User.objects.filter(pk=instance.user_id).update(points=F("points") - instance.points_awarded)
      instance.delete()


class NotificationListCreateView(generics.ListCreateAPIView):
  serializer_class = NotificationSerializer
  permission_classes = [IsAuthenticated]

  def get_queryset(self):
    queryset = Notification.objects.all().order_by("-created_at")
    user = self.request.query_params.get("user")
    read_status = self.request.query_params.get("read_status")
    if user:
      queryset = queryset.filter(user_id=user)
    if read_status is not None:
      queryset = queryset.filter(read_status=read_status.lower() == "true")
    return queryset

class NotificationView(generics.RetrieveUpdateDestroyAPIView):
  queryset = Notification.objects.all()
  serializer_class = NotificationSerializer
  permission_classes = [IsAuthenticated]
  lookup_field = "notification_id"

class MarkNotificationsReadView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request, student_id):
    user = get_object_or_404(User, student_id=student_id)
    updated = Notification.objects.filter(user=user, read_status=False).update(read_status=True)
    return Response({
        "message": f"{updated} notification(s) marked as read"
      },
      status=status.HTTP_200_OK
    )


class SubmissionLogListCreateView(generics.ListCreateAPIView):
  serializer_class = SubmissionLogSerializer
  permission_classes = [IsAuthenticated]

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
  permission_classes = [IsAuthenticated]
  lookup_field = "log_id"
