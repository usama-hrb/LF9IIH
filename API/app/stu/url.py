from django.urls import path
from . import views
from . import student_auth
from . import student_stats

urlpatterns = [
    # Teacher/Doctor endpoints
    path("list", views.list_students_view.as_view(), name="list"),
    path("create", views.create_student_view.as_view(), name="create"),
    path("<int:student>/update", views.update_student_view.as_view(), name="update"),
    path("<int:student>/delete", views.delete_student_view.as_view(), name="delete"),
    path("<int:student>/detail", views.student_detail_view.as_view(), name="detail"),
    
    # Student authentication and profile endpoints
    path("auth/login", student_auth.student_login_view, name="student_login"),
    path("<int:student_code>/profile", student_auth.student_profile_view, name="student_profile"),
    
    # Student statistics and history endpoints
    path("<int:student_code>/memorization-history", student_stats.student_memorization_history_view, name="student_memorization_history"),
    path("<int:student_code>/review-history", student_stats.student_review_history_view, name="student_review_history"),
    path("<int:student_code>/attendance-history", student_stats.student_attendance_history_view, name="student_attendance_history"),
    path("<int:student_code>/payment-history", student_stats.student_payment_history_view, name="student_payment_history"),
    path("<int:student_code>/statistics", student_stats.student_statistics_view, name="student_statistics"),
]
