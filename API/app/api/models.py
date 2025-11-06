from django.db import models
import random


def generate_doctor_code():
    while True:
        code = random.randint(100000, 999999)
        if not Doctor.objects.filter(code=code).exists():
            return code


class Doctor(models.Model):
    code = models.CharField(
        max_length=12, default=generate_doctor_code, primary_key=True
    )
    verified = models.BooleanField(default=False)
    password = models.CharField(max_length=100)
    first_name = models.CharField(max_length=35)
    last_name = models.CharField(max_length=35)
    phone_number = models.CharField(max_length=10, blank=True, null=True)
    email = models.EmailField()

    def __str__(self):
        return f"Doctor: {self.first_name} {self.last_name}, Email: {self.email}, Verified: {self.verified}, Code: {self.code}, Phone: {self.phone_number}"

    class Meta:
        db_table = "Doctor"
        ordering = ["first_name", "last_name"]


# from django.db import models
# from django.core.validators import MinValueValidator, MaxValueValidator
# import random


# def generate_student_code():
#     while True:
#         code = random.randint(100000, 999999)
#         if not Student.objects.filter(code=code).exists():
#             return code


# def generate_doctor_code():
#     while True:
#         code = random.randint(100000, 999999)
#         if not Doctor.objects.filter(code=code).exists():
#             return code


# class Doctor(models.Model):
#     code = models.CharField(
#         max_length=100, default=generate_doctor_code, primary_key=True
#     )
#     first_name = models.CharField(max_length=100)
#     last_name = models.CharField(max_length=100)
#     phone_number = models.CharField(max_length=20, blank=True, null=True)
#     email = models.EmailField(blank=True, null=True)

#     def __str__(self):
#         return f"{self.first_name} {self.last_name}"

#     class Meta:
#         db_table = "Doctor"
#         ordering = ["first_name", "last_name"]
#         constraints = [
#             models.UniqueConstraint(
#                 fields=["first_name", "last_name"], name="unique_doctor_name"
#             ),
#             models.UniqueConstraint(fields=["email"], name="unique_doctor_email"),
#         ]


# class Student(models.Model):
#     code = models.CharField(
#         max_length=100, default=generate_student_code, primary_key=True
#     )
#     doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, null=True)
#     first_name = models.CharField(max_length=100)
#     last_name = models.CharField(max_length=100)
#     date_of_birth = models.DateField(blank=True, null=True)
#     date_of_registration = models.DateField(blank=True, null=True)
#     phone_number = models.CharField(max_length=20, blank=True, null=True)
#     gender = models.CharField(max_length=10, blank=True, null=True)
#     age = models.IntegerField(blank=True, null=True)

#     def __str__(self):
#         return f"{self.first_name} {self.last_name}"

#     class Meta:
#         db_table = "Student"
#         constraints = [
#             models.UniqueConstraint(
#                 fields=["first_name", "last_name", "doctor"], name="student_per_doctor"
#             )
#         ]


# class Parent(models.Model):
#     code = models.CharField(max_length=100, primary_key=True)
#     student = models.ForeignKey(Student, on_delete=models.CASCADE)
#     first_name = models.CharField(max_length=100)
#     last_name = models.CharField(max_length=100)
#     phone_number = models.CharField(max_length=20, blank=True, null=True)

#     def __str__(self):
#         return f"{self.first_name} {self.last_name}"

#     class Meta:
#         db_table = "Parent"
#         constraints = [
#             models.UniqueConstraint(
#                 fields=["first_name", "last_name"], name="unique_parent"
#             )
#         ]


# class Attendance(models.Model):
#     code = models.CharField(max_length=100, primary_key=True)
#     student = models.ForeignKey(Student, on_delete=models.CASCADE)
#     attendance_date = models.DateField(blank=True, null=True)

#     def __str__(self):
#         return f"{self.student} - {self.attendance_date}"

#     class Meta:
#         db_table = "Attendance"
#         ordering = ["attendance_date"]
#         constraints = [
#             models.UniqueConstraint(
#                 fields=["student", "attendance_date"],
#                 name="unique_attendance_date_per_student",
#             )
#         ]


# class Chapters(models.Model):
#     code = models.CharField(max_length=100, primary_key=True)
#     name = models.CharField(max_length=100)
#     number_of_verses = models.IntegerField(blank=True, null=True)

#     def __str__(self):
#         return self.name

#     class Meta:
#         db_table = "Chapters"
#         constraints = [models.UniqueConstraint(fields=["name"], name="unique_chapters")]


# class CompletedChapter(models.Model):
#     STATE_CHOICES = [("inprogress", "inprogress"), ("completed", "completed")]
#     code = models.CharField(max_length=100, primary_key=True)
#     student = models.ForeignKey(Student, on_delete=models.CASCADE)
#     chapter = models.ForeignKey(Chapters, on_delete=models.CASCADE)
#     completion_date = models.DateField(blank=True, null=True)
#     evaluation = models.TextField(blank=True, null=True)
#     fromVerse = models.IntegerField(
#         validators=[MinValueValidator(1), MaxValueValidator(300)]
#     )
#     toVerse = models.IntegerField(
#         validators=[MinValueValidator(1), MaxValueValidator(300)]
#     )
#     feedback = models.TextField(blank=True, null=True)
#     state = models.CharField(max_length=10, default="inprogress", choices=STATE_CHOICES)

#     def __str__(self):
#         return f"{self.student} - {self.chapter}"

#     class Meta:
#         db_table = "CompletedChapter"


# class CompletedEighth(models.Model):
#     STATE_CHOICES = [("inprogress", "inprogress"), ("completed", "completed")]
#     code = models.CharField(max_length=100, primary_key=True)
#     student = models.ForeignKey(Student, on_delete=models.CASCADE)
#     quarter_code = models.CharField(max_length=100, blank=True, null=True)
#     completion_date = models.DateField(blank=True, null=True)
#     eighth_code = models.CharField(max_length=100, blank=True, null=True)
#     evaluation = models.TextField(blank=True, null=True)
#     feedback = models.TextField(blank=True, null=True)
#     state = models.CharField(max_length=10, default="inprogress", choices=STATE_CHOICES)

#     def __str__(self):
#         return f"{self.student} - Eighth {self.eighth_code}"

#     class Meta:
#         db_table = "CompletedEighth"


# class CompletedQuarter(models.Model):
#     code = models.CharField(max_length=100, primary_key=True)
#     student = models.ForeignKey(Student, on_delete=models.CASCADE)
#     quarter_code = models.CharField(max_length=100, blank=True, null=True)
#     completion_date = models.DateField(blank=True, null=True)
#     evaluation = models.TextField(blank=True, null=True)
#     feedback = models.TextField(blank=True, null=True)

#     def __str__(self):
#         return f"{self.student} - Quarter {self.quarter_code}"

#     class Meta:
#         db_table = "CompletedQuarter"


# class Payments(models.Model):
#     code = models.CharField(max_length=100, primary_key=True)
#     student = models.ForeignKey(Student, on_delete=models.CASCADE)
#     amount = models.IntegerField(null=False)
#     month = models.CharField(max_length=20, blank=True, null=True)

#     def __str__(self):
#         return f"{self.student} - {self.month}"

#     class Meta:
#         db_table = "Payments"
