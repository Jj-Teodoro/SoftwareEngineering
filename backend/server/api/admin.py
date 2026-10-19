from django.contrib import admin
from .models import User, Event, Attendance, Notification, SubmissionLog, Requirement, RequirementCompletion, Hobby

admin.site.register(User)
admin.site.register(Event)
admin.site.register(Attendance)
admin.site.register(Notification)
admin.site.register(SubmissionLog)
admin.site.register(Requirement)
admin.site.register(RequirementCompletion)
admin.site.register(Hobby)
