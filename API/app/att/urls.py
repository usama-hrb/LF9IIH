from django.urls import path
from . import views

urlpatterns = [
    path("create", views.create_attendance_view.as_view(), name="register"),
    path("record", views.get_attendance_view.as_view(), name="record"),
    path("all", views.get_all_students_attendance_view.as_view(), name="all_students"),
]
