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
from api import views
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # auth
    path("api/auth/login", views.LoginView.as_view(), name="login"),
    path("api/auth/logout", views.LogoutView.as_view(), name="logout"),
    path("api/auth/password-request", views.PasswordRequestView.as_view(), name="password_request"),
    path("api/token", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh", views.SafeTokenRefreshView.as_view(), name="token_refresh"),

    # users
    path("api/user", views.UserListView.as_view(), name="user_list"),
    path("api/user/me", views.CurrentUserView.as_view(), name="current_user"),
    path("api/user/me/password", views.ChangePasswordView.as_view(), name="change_password"),
    path("api/user/me/presence", views.PresenceView.as_view(), name="presence"),
    path("api/user/register", views.CreateUserView.as_view(), name="register"),
    path("api/user/bulk", views.CreateUserBulkView.as_view(), name="import_user"),
    path("api/user/bulk-delete", views.DeleteUserBulkView.as_view(), name="delete_users"),
    path("api/user/<str:student_id>", views.UserDetailView.as_view(), name="user_methods"),
    path("api/user/<str:student_id>/account", views.AccountView.as_view(), name="user_account"),
    path("api/user/<str:student_id>/password-request", views.PasswordRequestDismissView.as_view(), name="dismiss_password_request"),
    path("api/staff", views.StaffListCreateView.as_view(), name="staff_list"),
    path("api/user/<str:student_id>/notifications/read", views.MarkNotificationsReadView.as_view(), name="mark_notifications_read"),

    # events and attendance
    path("api/event", views.EventListCreateView.as_view(), name="add_event"),
    path("api/event/<uuid:event_id>", views.EventView.as_view(), name="event_method"),
    path("api/event/<uuid:event_id>/announce", views.AnnounceEventView.as_view(), name="announce_event"),
    path("api/attendance", views.AttendanceListCreateView.as_view(), name="attendance_list"),
    path("api/attendance/scan", views.ScanAttendanceView.as_view(), name="attendance_scan"),
    path("api/attendance/<uuid:attendance_id>", views.AttendanceView.as_view(), name="attendance_method"),

    # notifications
    path("api/notification", views.NotificationListCreateView.as_view(), name="notification_list"),
    path("api/notification/<uuid:notification_id>", views.NotificationView.as_view(), name="notification_method"),

    # requirements and hobbies
    path("api/requirement", views.RequirementListCreateView.as_view(), name="requirement_list"),
    path("api/requirement/completion", views.RequirementCompletionListView.as_view(), name="requirement_completion_list"),
    path("api/requirement/completion/toggle", views.ToggleRequirementCompletionView.as_view(), name="requirement_completion_toggle"),
    path("api/requirement/<uuid:requirement_id>", views.RequirementView.as_view(), name="requirement_method"),
    path("api/hobby", views.HobbyListCreateView.as_view(), name="hobby_list"),

    # submission logs
    path("api/log", views.SubmissionLogListCreateView.as_view(), name="log_list"),
    path("api/log/<uuid:log_id>", views.SubmissionLogView.as_view(), name="log_method"),
]
