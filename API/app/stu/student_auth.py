"""
Student authentication views
Allows students to login with their student code
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Student
from rest_framework.exceptions import ValidationError


@csrf_exempt
@api_view(['POST'])
def student_login_view(request):
    """
    Student login with code
    POST: { "code": "123456" }
    """
    code = request.data.get('code')
    
    if not code:
        raise ValidationError("Student code is required")
    
    try:
        student = Student.objects.select_related('doctor').get(code=code)
        
        # Return student profile data
        data = {
            "code": student.code,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "name": f"{student.first_name} {student.last_name}",
            "parent": student.parent,
            "phone_number": student.phone_number,
            "age": student.age,
            "gender": student.gender,
            "memorization_method": student.memorization_method,
            "date_of_registration": student.date_of_registration.strftime('%Y-%m-%d'),
            "doctor": {
                "name": f"{student.doctor.first_name} {student.doctor.last_name}",
                "phone_number": student.doctor.phone_number,
            }
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Student.DoesNotExist:
        raise ValidationError("Invalid student code")


@csrf_exempt
@api_view(['GET'])
def student_profile_view(request, student_code):
    """
    Get student profile data
    """
    try:
        student = Student.objects.select_related('doctor').get(code=student_code)
        
        data = {
            "code": student.code,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "name": f"{student.first_name} {student.last_name}",
            "parent": student.parent,
            "phone_number": student.phone_number,
            "age": student.age,
            "gender": student.gender,
            "memorization_method": student.memorization_method,
            "date_of_registration": student.date_of_registration.strftime('%Y-%m-%d'),
            "doctor": {
                "name": f"{student.doctor.first_name} {student.doctor.last_name}",
                "phone_number": student.doctor.phone_number,
            }
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Student.DoesNotExist:
        raise ValidationError("Student not found")
