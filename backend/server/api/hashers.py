from django.contrib.auth.hashers import PBKDF2PasswordHasher


class TempPasswordHasher(PBKDF2PasswordHasher):
  """For admin-issued temporary passwords only.

  A temporary password is also kept readable (User.temp_password) so the admin can see it
  until the student signs in, so the full-strength hash adds no protection while it lasts,
  and it made creating accounts for a whole class take minutes. This one is quick. The first
  time the student signs in, Django re-hashes the password with the full-strength default
  hasher, and the student must then choose a new password anyway.
  """

  algorithm = "pbkdf2_sha256_temp"
  iterations = 10_000


def set_temp_password(user, password):
  """Sets `password` on `user` with the quick hasher (does not save)."""
  from django.contrib.auth.hashers import make_password

  user.password = make_password(password, hasher=TempPasswordHasher.algorithm)
  user._password = password
