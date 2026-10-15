from enum import StrEnum
from datetime import datetime
from tzlocal import get_localzone
from zoneinfo import ZoneInfo
import uuid

# for user

# User Role enum
class UserRole(StrEnum):
  STUDENT = "student"
  SCANNER = "scanner"
  ADMIN = "admin"

# User Status enum
class UserStatus(StrEnum):
  ACTIVE = "active"
  BANNED = "banned"

# Activity Status enum
class ActivityStatus(StrEnum):
  PENDING = "pending"
  APPROVED = "approved"
  REJECTED = "rejected" 

# Notification Type enum
class NotificationType(StrEnum):
  SYSTEM = "system"
  ACTIVITY = "activity"
  REMINDER = "reminder"

# Submission Log enum
class SubmissionLogAction(StrEnum):
  APPROVED = "approved"
  REJECTED = "rejected"
  EDITED = "edited"

def generateQrToken(length=32):
  """Creates unique token of desired length, default length = 32"""
  return uuid.uuid4().hex[:length]
  

def remove_duplicates(data, existing_ids):
  """Checks if user id is already on the array being sent or it's
  already in the database and returns an array of unique data not seen"""

  seen_id = set()
  filtered_data= []

  for item in data:
    user_id = item.get('student_id')
    if user_id and user_id not in existing_ids and user_id not in seen_id:
      seen_id.add(user_id)
      filtered_data.append(item)

  return filtered_data

def format_date(date):
  strDate = str(date)
  isoDate = datetime.fromisoformat(strDate)
  localDate = isoDate.astimezone(get_localzone())
  return localDate.strftime("%Y-%m-%dT%H:%M")

def convert_to_utc(date):
  local_dt = datetime.strptime(date, '%Y-%m-%dT%H:%M')
  local_dt = local_dt.replace(tzinfo=ZoneInfo("Asia/Manila"))
  utc_dt = local_dt.astimezone(ZoneInfo('UTC'))
  return utc_dt.isoformat()
 