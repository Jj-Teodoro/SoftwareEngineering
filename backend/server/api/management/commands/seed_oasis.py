import os
import secrets

from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import User, Event, Requirement, Hobby
from api.utils import UserRole

PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"

DEFAULT_STUDENTS = [
  # student_id, last, first, middle, program, year, section, status, email, contact, address
  ("2024-02333", "NIEVES", "RAFAEL JOSEPH", "G.", "BS Computer Engineering", 3, "BSCPE-3A", "ACTIVE",
   "rafaeljoseph.nieves@dyci.edu.ph", "0917-123-4567", "Bocaue, Bulacan"),
  ("2024-00429", "OCAMPO", "NATHAN LEO", "", "BS Computer Engineering", 3, "BSCPE-3A", "ACTIVE",
   "nathanleo.ocampo@dyci.edu.ph", "0917-234-5678", "Meycauayan, Bulacan"),
  ("2023-01187", "DELA CRUZ", "MARIA SANTOS", "", "BS Computer Science", 4, "BSCS-4A", "ACTIVE",
   "mariasantos.delacruz@dyci.edu.ph", "0918-345-6789", "Malolos, Bulacan"),
  ("2024-00981", "SANTOS", "JOHN MICHAEL", "R.", "BS Information Technology", 2, "BSIT-2B", "INACTIVE",
   "johnmichael.santos@dyci.edu.ph", "0919-456-7890", "Marilao, Bulacan"),
  ("2022-00754", "REYES", "ANGELA MARIE", "T.", "BS Computer Engineering", 4, "BSCPE-4A", "ACTIVE",
   "angelamarie.reyes@dyci.edu.ph", "0920-567-8901", "Guiguinto, Bulacan"),
  ("2024-01652", "GARCIA", "MARK ANTHONY", "V.", "BS Computer Science", 1, "BSCS-1C", "INACTIVE",
   "markanthony.garcia@dyci.edu.ph", "0921-678-9012", "Balagtas, Bulacan"),
]

DEFAULT_HOBBIES = ["Reading", "Gaming", "Coding", "Basketball", "Music", "Drawing", "Photography", "Dancing"]

DEFAULT_REQUIREMENTS = [("Organizational Shirt", 10), ("Lanyard", 10), ("Booklet", 10)]


class Command(BaseCommand):
  help = "Creates the first admin account and starter data (students, hobbies, requirements, one event)."

  def handle(self, *args, **options):
    username = os.getenv("ADMIN_USERNAME", "admin").lower()
    password = os.getenv("ADMIN_PASSWORD") or "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(12))

    admin = User.objects.filter(student_id=username).first()
    if admin is None:
      admin = User.objects.create_superuser(username, password, first_name="ACES Administrator")
      self.stdout.write(f"Admin login -> username: {username}  password: {password}")
    else:
      self.stdout.write(f"Admin '{username}' already exists, password unchanged")

    created = 0
    for sid, last, first, middle, program, year, section, status, email, contact, address in DEFAULT_STUDENTS:
      _, was_created = User.objects.get_or_create(student_id=sid, defaults={
        "last_name": last, "first_name": first, "middle_name": middle, "program": program,
        "year_level": year, "section": section, "status": status, "email": email,
        "contact_number": contact, "address": address, "role": UserRole.STUDENT.value,
        # no login until an admin creates the account
        "password": "!",
      })
      created += was_created
    self.stdout.write(f"Seeded {created} students")

    for label in DEFAULT_HOBBIES:
      Hobby.objects.get_or_create(label=label)
    self.stdout.write(f"Seeded {len(DEFAULT_HOBBIES)} hobbies")

    for title, points in DEFAULT_REQUIREMENTS:
      Requirement.objects.get_or_create(title=title, defaults={"point_value": points})
    self.stdout.write(f"Seeded {len(DEFAULT_REQUIREMENTS)} requirements")

    if not Event.objects.exists():
      Event.objects.create_event(
        title="General Assembly",
        date=timezone.localdate(),
        description="Sample seeded event",
        default_points=15,
        created_by=admin,
      )
      self.stdout.write("Seeded sample event")

    self.stdout.write(self.style.SUCCESS("Seed complete."))
