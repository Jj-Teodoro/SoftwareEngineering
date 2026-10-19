from rest_framework.permissions import BasePermission, SAFE_METHODS
from .utils import UserRole

STAFF_ROLES = (UserRole.ADMIN.value, UserRole.SCANNER.value)


def is_admin(user):
  return bool(user and user.is_authenticated and user.role == UserRole.ADMIN)


def is_staff_member(user):
  return bool(user and user.is_authenticated and user.role in STAFF_ROLES)


class IsAdmin(BasePermission):
  """Admins only (student roster, accounts, requirements)."""

  def has_permission(self, request, view):
    return is_admin(request.user)


class IsStaff(BasePermission):
  """Admins and scanners."""

  def has_permission(self, request, view):
    return is_staff_member(request.user)


class ReadAnyWriteStaff(BasePermission):
  """Any signed-in user can read; admins and scanners can write (events, attendance)."""

  def has_permission(self, request, view):
    if not (request.user and request.user.is_authenticated):
      return False
    return request.method in SAFE_METHODS or is_staff_member(request.user)


class ReadAnyWriteAdmin(BasePermission):
  """Any signed-in user can read; only admins can write (requirements, hobbies)."""

  def has_permission(self, request, view):
    if not (request.user and request.user.is_authenticated):
      return False
    return request.method in SAFE_METHODS or is_admin(request.user)
