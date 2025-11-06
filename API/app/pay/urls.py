from django.urls import path
from . import views

urlpatterns = [
    path(
        "<int:student>/create",
        views.create_payment_view.as_view(),
        name="create_payment",
    ),
    path(
        "<str:student>/all",
        views.student_payment_view.as_view(),
        name="get_student_payments",
    ),
    path("all", views.DoctorPaymentView.as_view(), name="get_all_payments"),
    path("total", views.get_all_payments_view.as_view(), name="get_total_payments"),
]
