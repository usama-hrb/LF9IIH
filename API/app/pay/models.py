from django.db import models
from stu.models import Student
from api.models import Doctor
from django.core.validators import MinValueValidator, MaxValueValidator


# Create your models here.
class Payment(models.Model):
    """
    Model to track student payment records
    """

    doctor = models.ForeignKey(
        Doctor, on_delete=models.CASCADE, related_name="payments"
    )
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    month = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    year = models.IntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)]
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        db_table = "Payments"
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        ordering = ["-month", "student"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "month", "year"],
                name="unique_payment_per_student_per_month_year",
            )
        ]

    def __str__(self):
        return f"Payment {self.id} {self.month} {self.year}: {self.amount}"
