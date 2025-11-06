from django.db.models import Sum
from stu.views import student_action_decorator
from .serializers import (
    DoctorPaymentSerializer,
    PaymentCreateSerializer,
    StudentPaymentSerializer,
    get_all_payments_serializer,
)
from django.utils.decorators import method_decorator
from api.views import authentication_decorator
from rest_framework.response import Response
from att.views import year_month_decorator
from django.db.models import Prefetch
from rest_framework import generics
from stu.models import Student
from .models import Payment

# Create your views here.


class create_payment_view(generics.CreateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentCreateSerializer

    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def create(self, request, *args, **kwargs):
        """
        Create a new payment record
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        month = serializer.validated_data["month"]
        year = serializer.validated_data["year"]

        instance = Payment.objects.filter(
            student=request.student, month=month, year=year
        ).first()
        if instance:
            instance.amount = serializer.validated_data["amount"]
            instance.save()
        else:
            serializer.save(student=request.student, doctor=request.doctor)
        return Response(serializer.data, status=201)


class DoctorPaymentView(generics.GenericAPIView):
    serializer_class = DoctorPaymentSerializer

    @method_decorator(authentication_decorator)
    @method_decorator(year_month_decorator)
    def get(self, request, *args, **kwargs):
        """
        Get payment record for students, given month and year
        """
        monthly_payment = Payment.objects.filter(month=request.month, year=request.year)
        students = (
            Student.objects.filter(doctor=request.doctor)
            .prefetch_related(
                Prefetch(
                    "payments", queryset=monthly_payment, to_attr="monthly_payment"
                )
            )
            .order_by("first_name", "last_name")
        )
        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data, status=200)


class student_payment_view(generics.GenericAPIView):
    serializer_class = StudentPaymentSerializer

    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def get(self, request, *args, **kwargs):
        """
        Get payment record for a student
        """
        payment = Payment.objects.filter(student=request.student).order_by(
            "-year", "-month"
        )
        serializer = self.get_serializer(payment, many=True)
        return Response(serializer.data, status=200)


class get_all_payments_view(generics.GenericAPIView):
    serializer_class = get_all_payments_serializer

    @method_decorator(authentication_decorator)
    def get(self, request, *args, **kwargs):
        """
        Get total payments for all students
        """
        total = (
            Payment.objects.filter(doctor=request.doctor).aggregate(
                total_amount=Sum("amount")
            )["total_amount"]
            or 0.0
        )
        serializer = self.get_serializer(data={"total": total})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=200)
