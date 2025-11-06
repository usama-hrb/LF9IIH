from django.db import models
from stu.models import Student


class Quarter(models.Model):
    code = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        db_table = "Quarter"
        constraints = [
            models.UniqueConstraint(
                fields=["code"],
                name="unique_quarter_code",
                violation_error_message="Quarter with this code already exists",
            )
        ]


class CompletedQuarter(models.Model):
    SESSION_TYPE_CHOICES = [
        ('memorization', 'Memorization'),
        ('review', 'Review'),
    ]
    
    code = models.AutoField(primary_key=True, auto_created=True)
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="completed_quarters"
    )
    quarter = models.ForeignKey(
        Quarter,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="quarters",
    )
    session_type = models.CharField(
        max_length=20,
        choices=SESSION_TYPE_CHOICES,
        default='review',
        help_text="Type of session: memorization or review"
    )
    # Hizb and eighth tracking
    hizb_number = models.IntegerField(null=True, blank=True)  # 1-60 (30 Juz × 2 Hizbs)
    eighth_number = models.IntegerField(null=True, blank=True)  # 1-8 within the Hizb
    is_hizb_completed = models.BooleanField(default=False)
    
    completion_date = models.DateField(null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True)
    quick_notes = models.CharField(max_length=200, null=True, blank=True)
    evaluation = models.TextField(null=True, blank=True)
    feedback = models.TextField(null=True, blank=True)
    progress = models.TextField(null=True, blank=True)
    
    # Next session planning
    next_hizb_number = models.IntegerField(null=True, blank=True)
    next_eighth_number = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)

    def __str__(self):
        return f"{self.code} ({self.student})"

    class Meta:
        db_table = "CompletedQuarter"
        verbose_name = "Completed Quarter"
        verbose_name_plural = "Completed Quarters"
        ordering = ["-completion_date"]
