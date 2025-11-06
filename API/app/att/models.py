from django.db import models
from stu.models import Student


class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    attendance_date = models.DateField(blank=True, null=True)
    state = models.CharField(
        max_length=20,
        choices=[("present", "Present"), ("absent", "Absent")],
    )

    def __str__(self):
        return f"Attendance {self.code} for {self.student.name} on {self.attendance_date}, State: {self.state}"

    class Meta:
        db_table = "Attendance"
        ordering = ["attendance_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "attendance_date"],
                name="unique_attendance_date_per_student",
            )
        ]
