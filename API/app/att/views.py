from datetime import date

from rest_framework import status
from rest_framework import generics
from stu.views import student_action_decorator
from api.views import authentication_decorator
from rest_framework.response import Response
from api.serializers import created_serializer, success_serializer
from django.utils.decorators import method_decorator
from .models import Attendance
from functools import wraps
from .serializers import (
    attendance_serializer,
    date_serializer,
)


def year_month_decorator(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        year = request.query_params.get("year")
        month = request.query_params.get("month")
        if not year:
            year = date.today().year
        if not month:
            month = date.today().month
        date_serializer_instance = date_serializer(data={"date": f"{year}-{month}-01"})
        date_serializer_instance.is_valid(raise_exception=True)
        request.month = date_serializer_instance.validated_data["date"].month
        request.year = date_serializer_instance.validated_data["date"].year
        return func(request, *args, **kwargs)

    return wrapper


class create_attendance_view(generics.CreateAPIView):
    queryset = Attendance.objects.all()
    serializer_class = attendance_serializer

    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def create(self, request, *args, **kwargs):
        """
        Create a new attendance record
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        date = serializer.validated_data["attendance_date"]

        try:
            att = Attendance.objects.get(student=request.student, attendance_date=date)
            att.state = serializer.validated_data["state"]
            att.save()
            success = success_serializer(data={})
            success.is_valid(raise_exception=False)
            return Response(success.data, status=status.HTTP_200_OK)
        except Attendance.DoesNotExist:
            serializer.save(student=request.student, attendance_date=date)
            success = created_serializer(data={})
            success.is_valid(raise_exception=False)
            return Response(success.data, status=status.HTTP_201_CREATED)


class get_attendance_view(generics.GenericAPIView):
    serializer_class = attendance_serializer

    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def get(self, request, *args, **kwargs):
        """
        Get attendance record for a student, given student code and date month
        """
        queryset = Attendance.objects.all()

        year = request.query_params.get("year")
        month = request.query_params.get("month")

        if not year:
            year = date.today().year
        if not month:
            month = date.today().month

        date_serializer_instance = date_serializer(data={"date": f"{year}-{month}-01"})
        date_serializer_instance.is_valid(raise_exception=True)

        month = date_serializer_instance.validated_data["date"].month
        year = date_serializer_instance.validated_data["date"].year

        queryset = queryset.filter(
            student=request.student,
            state__in=["present", "absent"],
            attendance_date__month=month,
            attendance_date__year=year,
        )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class get_all_students_attendance_view(generics.GenericAPIView):
    """
    Get attendance for all students for a specific date
    """
    
    @method_decorator(authentication_decorator)
    def get(self, request, *args, **kwargs):
        """
        Get attendance records for all students for a specific date
        Query params:
        - date: YYYY-MM-DD format (defaults to today)
        """
        try:
            from stu.models import Student
            
            # Get date parameter
            date_param = request.query_params.get("date")
            if not date_param:
                target_date = date.today()
            else:
                date_serializer_instance = date_serializer(data={"date": date_param})
                date_serializer_instance.is_valid(raise_exception=True)
                target_date = date_serializer_instance.validated_data["date"]
            
            # Get only students belonging to the logged-in doctor
            students = Student.objects.filter(doctor=request.doctor).order_by('first_name', 'last_name')
            
            # Build response with attendance status
            result = []
            for student in students:
                try:
                    attendance = Attendance.objects.get(
                        student=student,
                        attendance_date=target_date
                    )
                    status_value = attendance.state
                except Attendance.DoesNotExist:
                    status_value = None  # Not marked
                
                # Combine first_name and last_name
                full_name = f"{student.first_name} {student.last_name}".strip()
                
                result.append({
                    "code": student.code,
                    "name": full_name,
                    "status": status_value,
                    "date": target_date.isoformat()
                })
            
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(f"Error in get_all_students_attendance_view: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": str(e), "detail": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
