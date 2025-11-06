from django.urls import path, include
from . import views
from att.views import get_all_students_attendance_view
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"
    ),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # API Endpoints List
    path("endpoints", views.list_endpoints, name="list_endpoints"),
    # Authentication and User Management
    path("me", views.get_me_view.as_view(), name="get_me"),
    path("login", views.login_view.as_view(), name="login"),
    path("signup", views.signup_view.as_view(), name="signup"),
    path("verify", views.verify_account_view.as_view(), name="verify_account"),
    path("reset-password", views.reset_password_view.as_view(), name="reset_password"),
    # Student, Attendance, Chapters, Payments
    path("student/", include("stu.url"), name="students"),
    path("attendance/<int:student>/", include("att.urls"), name="attendance"),
    path("attendance/all", get_all_students_attendance_view.as_view(), name="all_attendance"),
    path("chapters/<int:student>/", include("chap.urls"), name="chapters"),
    path("quarters/<int:student>/", include("eig.urls"), name="quarters"),
    path("payments/", include("pay.urls"), name="payments"),
]
