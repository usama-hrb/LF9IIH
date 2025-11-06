"""
Student statistics and history views
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Q
from .models import Student
from chap.models import CompletedChapter
from eig.models import CompletedQuarter
from att.models import Attendance
from pay.models import Payment
from rest_framework.exceptions import ValidationError
from datetime import datetime, timedelta


@csrf_exempt
@api_view(['GET'])
def student_memorization_history_view(request, student_code):
    """
    Get student's memorization history
    """
    try:
        student = Student.objects.get(code=student_code)
        
        if student.memorization_method == 'chapter':
            # Get chapter-based memorization
            sessions = CompletedChapter.objects.filter(
                student=student,
                session_type='memorization'
            ).select_related('surah', 'next_surah').order_by('-completion_date')
            
            data = []
            for session in sessions:
                data.append({
                    "id": session.code,
                    "type": "chapter",
                    "session_type": "memorization",
                    "surah_name": session.surah.name if session.surah else None,
                    "surah_number": session.surah.code if session.surah else None,
                    "verse_from": session.verse_from,
                    "verse_to": session.verse_to,
                    "is_surah_completed": session.is_surah_completed,
                    "completion_date": session.completion_date.strftime('%Y-%m-%d') if session.completion_date else None,
                    "rating": session.rating,
                    "quick_notes": session.quick_notes,
                    "evaluation": session.evaluation,
                    "progress": session.progress,
                    "feedback": session.feedback,
                })
        else:
            # Get eighth-based memorization
            sessions = CompletedQuarter.objects.filter(
                student=student,
                session_type='memorization'
            ).select_related('quarter').order_by('-completion_date')
            
            data = []
            for session in sessions:
                data.append({
                    "id": session.code,
                    "type": "eighth",
                    "session_type": "memorization",
                    "hizb_number": session.hizb_number,
                    "eighth_number": session.eighth_number,
                    "is_hizb_completed": session.is_hizb_completed,
                    "completion_date": session.completion_date.strftime('%Y-%m-%d') if session.completion_date else None,
                    "rating": session.rating,
                    "quick_notes": session.quick_notes,
                    "evaluation": session.evaluation,
                    "progress": session.progress,
                    "feedback": session.feedback,
                })
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Student.DoesNotExist:
        raise ValidationError("Student not found")


@csrf_exempt
@api_view(['GET'])
def student_review_history_view(request, student_code):
    """
    Get student's review history
    """
    try:
        student = Student.objects.get(code=student_code)
        
        if student.memorization_method == 'chapter':
            sessions = CompletedChapter.objects.filter(
                student=student,
                session_type='review'
            ).select_related('surah').order_by('-completion_date')
            
            data = []
            for session in sessions:
                data.append({
                    "id": session.code,
                    "type": "chapter",
                    "session_type": "review",
                    "surah_name": session.surah.name if session.surah else None,
                    "surah_number": session.surah.code if session.surah else None,
                    "verse_from": session.verse_from,
                    "verse_to": session.verse_to,
                    "completion_date": session.completion_date.strftime('%Y-%m-%d') if session.completion_date else None,
                    "rating": session.rating,
                    "quick_notes": session.quick_notes,
                    "evaluation": session.evaluation,
                    "feedback": session.feedback,
                })
        else:
            sessions = CompletedQuarter.objects.filter(
                student=student,
                session_type='review'
            ).select_related('quarter').order_by('-completion_date')
            
            data = []
            for session in sessions:
                data.append({
                    "id": session.code,
                    "type": "eighth",
                    "session_type": "review",
                    "hizb_number": session.hizb_number,
                    "eighth_number": session.eighth_number,
                    "completion_date": session.completion_date.strftime('%Y-%m-%d') if session.completion_date else None,
                    "rating": session.rating,
                    "quick_notes": session.quick_notes,
                    "evaluation": session.evaluation,
                    "feedback": session.feedback,
                })
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Student.DoesNotExist:
        raise ValidationError("Student not found")


@csrf_exempt
@api_view(['GET'])
def student_attendance_history_view(request, student_code):
    """
    Get student's attendance history
    """
    try:
        student = Student.objects.get(code=student_code)
        
        attendance_records = Attendance.objects.filter(
            student=student
        ).order_by('-attendance_date')
        
        data = []
        for record in attendance_records:
            data.append({
                "id": record.id,
                "attendance_date": record.attendance_date.strftime('%Y-%m-%d'),
                "state": record.state,
            })
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Student.DoesNotExist:
        raise ValidationError("Student not found")


@csrf_exempt
@api_view(['GET'])
def student_payment_history_view(request, student_code):
    """
    Get student's payment history
    """
    try:
        student = Student.objects.get(code=student_code)
        
        payments = Payment.objects.filter(
            student=student
        ).order_by('-year', '-month')
        
        data = []
        for payment in payments:
            data.append({
                "id": payment.id,
                "amount": float(payment.amount),
                "month": payment.month,
                "year": payment.year,
                "date": f"{str(payment.month).zfill(2)}-{payment.year}",
                "created_at": payment.created_at.strftime('%Y-%m-%d'),
            })
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Student.DoesNotExist:
        raise ValidationError("Student not found")


@csrf_exempt
@api_view(['GET'])
def student_statistics_view(request, student_code):
    """
    Get student's overall statistics
    """
    try:
        student = Student.objects.get(code=student_code)
        
        # Attendance stats
        total_attendance = Attendance.objects.filter(student=student).count()
        present_count = Attendance.objects.filter(student=student, state='present').count()
        absent_count = Attendance.objects.filter(student=student, state='absent').count()
        attendance_rate = (present_count / total_attendance * 100) if total_attendance > 0 else 0
        
        # Payment stats
        total_payments = Payment.objects.filter(student=student).count()
        total_amount_paid = sum([float(p.amount) for p in Payment.objects.filter(student=student)])
        
        # Memorization stats
        if student.memorization_method == 'chapter':
            total_memorization_sessions = CompletedChapter.objects.filter(
                student=student, 
                session_type='memorization'
            ).count()
            total_review_sessions = CompletedChapter.objects.filter(
                student=student, 
                session_type='review'
            ).count()
            completed_surahs = CompletedChapter.objects.filter(
                student=student,
                session_type='memorization',
                is_surah_completed=True
            ).count()
            
            # Average rating
            sessions_with_rating = CompletedChapter.objects.filter(
                student=student,
                rating__isnull=False
            )
            avg_rating = sum([s.rating for s in sessions_with_rating]) / len(sessions_with_rating) if sessions_with_rating else 0
        else:
            total_memorization_sessions = CompletedQuarter.objects.filter(
                student=student,
                session_type='memorization'
            ).count()
            total_review_sessions = CompletedQuarter.objects.filter(
                student=student,
                session_type='review'
            ).count()
            completed_surahs = 0  # Not applicable for eighth method
            
            sessions_with_rating = CompletedQuarter.objects.filter(
                student=student,
                rating__isnull=False
            )
            avg_rating = sum([s.rating for s in sessions_with_rating]) / len(sessions_with_rating) if sessions_with_rating else 0
        
        data = {
            "attendance": {
                "total": total_attendance,
                "present": present_count,
                "absent": absent_count,
                "rate": round(attendance_rate, 1),
            },
            "payments": {
                "total_count": total_payments,
                "total_amount": total_amount_paid,
            },
            "memorization": {
                "total_sessions": total_memorization_sessions,
                "total_review_sessions": total_review_sessions,
                "completed_surahs": completed_surahs,
                "average_rating": round(avg_rating, 1),
            }
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Student.DoesNotExist:
        raise ValidationError("Student not found")
