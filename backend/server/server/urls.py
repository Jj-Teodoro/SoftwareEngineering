"""
URL configuration for server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from api.views import (
    CreateUserView,
    CreateUserBulkView,
    UserListView,
    CurrentUserView,
    UserDetailView,
    EventListCreateView,
    EventView,
    AttendanceListCreateView,
    AttendanceView,
    NotificationListCreateView,
    NotificationView,
    MarkNotificationsReadView,
    SubmissionLogListCreateView,
    SubmissionLogView,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/token", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/user", UserListView.as_view(), name="user_list"),
    path("api/user/me", CurrentUserView.as_view(), name="current_user"),
    path("api/user/register", CreateUserView.as_view(), name="register"),
    path("api/user/bulk", CreateUserBulkView.as_view(), name="import_user"),
    path("api/user/<str:student_id>", UserDetailView.as_view(), name="user_methods"),
    path("api/user/<str:student_id>/notifications/read", MarkNotificationsReadView.as_view(), name="mark_notifications_read"),
    path("api/event", EventListCreateView.as_view(), name="add_event"),
    path("api/event/<uuid:event_id>", EventView.as_view(), name="event_method"),
    path("api/attendance", AttendanceListCreateView.as_view(), name="attendance_list"),
    path("api/attendance/<uuid:attendance_id>", AttendanceView.as_view(), name="attendance_method"),
    path("api/notification", NotificationListCreateView.as_view(), name="notification_list"),
    path("api/notification/<uuid:notification_id>", NotificationView.as_view(), name="notification_method"),
    path("api/log", SubmissionLogListCreateView.as_view(), name="log_list"),
    path("api/log/<uuid:log_id>", SubmissionLogView.as_view(), name="log_method"),
]
