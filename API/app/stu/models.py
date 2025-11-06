from django.db import models
from django.core.validators import RegexValidator
from api.models import Doctor
from datetime import date
import random

digits = RegexValidator(r"^\d+$", "Only digits are allowed.")


def generate_code():
    while True:
        code = random.randint(100000, 999999)
        if not Student.objects.filter(code=code).exists():
            return code


class Student(models.Model):
    code = models.CharField(max_length=12, default=generate_code, primary_key=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100, blank=False)
    last_name = models.CharField(max_length=100, blank=False)
    parent = models.CharField(max_length=100, blank=False)
    phone_number = models.CharField(max_length=10, blank=False, validators=[digits])
    date_of_registration = models.DateField(default=date.today)
    gender = models.CharField(max_length=1)
    age = models.IntegerField(blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    memorization_method = models.CharField(
        max_length=7,
        choices=[
            ("chapter", "Chapter"),
            ("eighth", "Eighth"),
        ],
        blank=False,
        default="chapter",
    )

    def __str__(self):
        return f"Student {self.first_name} {self.last_name} ({self.code}), Doctor: {self.doctor}, {self.age} years old, Gender: {self.gender}"

    class Meta:
        db_table = "Student"
        indexes = [
            models.Index(fields=["first_name", "last_name"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["first_name", "last_name", "doctor"],
                name="student_per_doctor",
                violation_error_message="Student with this first and last name already exists for this doctor",
            )
        ]
