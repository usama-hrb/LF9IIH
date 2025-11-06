from api.views import authentication_decorator
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db.utils import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from .models import Student
from functools import wraps
from api.serializers import code_serializer, success_serializer
from .serializers import student_serializer, student_detail_serializer, student_list_serializer


def student_action_decorator(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        student_code = kwargs.get("student")
        student = Student.objects.filter(code=student_code).first()
        if not student_code or not student:
            raise ValidationError("Student not found")
        if student.doctor.code != getattr(request, "code", None):
            raise ValidationError("Permission denied")
        request.student = student
        return func(request, *args, **kwargs)

    return wrapper


class create_student_view(generics.CreateAPIView):
    queryset = Student.objects.all()
    serializer_class = student_serializer

    @method_decorator(csrf_exempt)
    @method_decorator(authentication_decorator)
    def create(self, request, *args, **kwargs):
        """
        Create a new student
        """
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(doctor=request.doctor)
            code = code_serializer(data={"code": serializer.instance.code})
            code.is_valid(raise_exception=False)
            return Response(code.data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            raise ValidationError(
                "Student with this name already exists for this doctor"
            )


class update_student_view(generics.UpdateAPIView):
    queryset = Student.objects.all()
    serializer_class = student_serializer
    lookup_field = "code"

    @method_decorator(csrf_exempt)
    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def update(self, request, *args, **kwargs):
        """
        Update a student's information
        """
        try:
            partial = kwargs.pop("partial", False)
            serializer = self.get_serializer(
                request.student, data=request.data, partial=partial
            )
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            code = code_serializer(data={"code": serializer.instance.code})
            code.is_valid(raise_exception=False)
            return Response(code.data, status=status.HTTP_201_CREATED)
        except Student.DoesNotExist:
            raise ValidationError("Student not found")


class delete_student_view(generics.DestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = student_serializer
    lookup_field = "code"

    @method_decorator(csrf_exempt)
    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def delete(self, request, *args, **kwargs):
        """
        Delete a student by code
        """
        try:
            self.perform_destroy(request.student)
            success = success_serializer(data={})
            success.is_valid(raise_exception=False)
            return Response(success.data, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            raise ValidationError("Student not found")


class student_detail_view(generics.RetrieveAPIView):
    queryset = Student.objects.all()
    serializer_class = student_detail_serializer
    lookup_field = "code"

    @method_decorator(csrf_exempt)
    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def get(self, request, *args, **kwargs):
        """
        Get student details by code
        """
        serializer = self.get_serializer(request.student)
        return Response(serializer.data, status=status.HTTP_200_OK)


class list_students_view(generics.ListAPIView):
    serializer_class = student_list_serializer

    @method_decorator(csrf_exempt)
    @method_decorator(authentication_decorator)
    def get(self, request, *args, **kwargs):
        """
        Get all students for the authenticated doctor
        """
        students = Student.objects.filter(doctor=request.doctor).order_by('-date_of_registration')
        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
