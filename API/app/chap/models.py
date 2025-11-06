from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from stu.models import Student


# Create your models here.
class Chapter(models.Model):
    code = models.IntegerField(
        auto_created=True,
        primary_key=True,
        validators=[MinValueValidator(1), MaxValueValidator(114)],
    )
    name = models.CharField(max_length=50)
    number_of_verses = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(300)]
    )

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        db_table = "Chapter"
        constraints = [
            models.UniqueConstraint(
                fields=["code"],
                name="unique_chapter_code",
                violation_error_message="Chapter with this code already exists",
            )
        ]


class CompletedChapter(models.Model):
    SESSION_TYPE_CHOICES = [
        ('memorization', 'Memorization'),
        ('review', 'Review'),
    ]
    
    code = models.AutoField(primary_key=True, auto_created=True)
    student = models.ForeignKey(
        Student,
        to_field="code",
        on_delete=models.CASCADE,
        related_name="completed_chapters",
    )
    chapter = models.ForeignKey(
        Chapter,
        to_field="code",
        on_delete=models.PROTECT,
        related_name="completed_by_students",
    )
    session_type = models.CharField(
        max_length=20,
        choices=SESSION_TYPE_CHOICES,
        default='review',
        help_text="Type of session: memorization or review"
    )
    # Surah-based tracking fields
    surah = models.ForeignKey(
        Chapter,
        to_field="code",
        on_delete=models.PROTECT,
        related_name="completed_surahs",
        null=True,
        blank=True,
    )
    verse_from = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    verse_to = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    is_surah_completed = models.BooleanField(default=False)
    
    completion_date = models.DateField(null=True, blank=True, default=None)
    rating = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    quick_notes = models.CharField(max_length=200, null=True, blank=True)
    evaluation = models.TextField(null=True, blank=True)
    progress = models.TextField(null=True, blank=True)
    feedback = models.TextField(null=True, blank=True)
    
    # Next session planning
    next_surah = models.ForeignKey(
        Chapter,
        to_field="code",
        on_delete=models.PROTECT,
        related_name="planned_next_surahs",
        null=True,
        blank=True,
    )
    next_verse_from = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    next_verse_to = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)

    class Meta:
        db_table = "CompletedChapter"
        verbose_name = "Completed Chapter"
        verbose_name_plural = "Completed Chapters"
        ordering = ["-completion_date"]

    def __str__(self):
        return f"{self.student.code} - {self.chapter.code}"
