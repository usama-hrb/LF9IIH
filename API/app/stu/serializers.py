from datetime import date
from rest_framework import serializers
from .models import Student


class student_serializer(serializers.ModelSerializer):
    def validate_first_name(self, value):
        if len(value) <= 3:
            raise serializers.ValidationError("First Name too short")
        return value

    def validate_last_name(self, value):
        if len(value) <= 3:
            raise serializers.ValidationError("Last Name too short")
        return value

    def validate_phone_number(self, value):
        if len(value) not in range(10, 15):
            raise serializers.ValidationError("Phone number is not valid")
        return value

    def validate_age(self, value):
        if value <= 0:
            raise serializers.ValidationError("Age must be a positive integer")
        return value

    class Meta:
        model = Student
        fields = [
            "first_name",
            "last_name",
            "parent",
            "phone_number",
            "memorization_method",
            "gender",
            "age",
        ]


class student_detail_serializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    payed = serializers.SerializerMethodField()

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_payed(self, obj):
        queries = obj.payments.filter(month=date.today().month, year=date.today().year)
        if not queries.exists():
            return False
        return queries.first().amount > 0

    class Meta:
        model = Student
        fields = [
            "age",
            "code",
            "name",
            "payed",
            "parent",
            "phone_number",
            "date_of_registration",
            "memorization_method",
        ]


class student_list_serializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    next_review_session = serializers.SerializerMethodField()
    next_memorization_session = serializers.SerializerMethodField()

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def get_next_review_session(self, obj):
        """Get the next planned review session for this student"""
        if obj.memorization_method == "chapter":
            # Get the latest REVIEW chapter completion with a next_surah planned
            latest = obj.completed_chapters.filter(
                session_type='review',
                next_surah__isnull=False
            ).order_by('-created_at').first()
            
            if latest and latest.next_surah:
                session_text = f"{latest.next_surah.name}"
                if latest.next_verse_from and latest.next_verse_to:
                    session_text += f" ({latest.next_verse_from}-{latest.next_verse_to})"
                return session_text
        else:
            # Get the latest REVIEW quarter completion with a next_hizb planned
            latest = obj.completed_quarters.filter(
                session_type='review',
                next_hizb_number__isnull=False
            ).order_by('-created_at').first()
            
            if latest and latest.next_hizb_number:
                session_text = f"الحزب{latest.next_hizb_number}"
                if latest.next_eighth_number:
                    session_text += f" الثمن{latest.next_eighth_number}"
                return session_text
        
        return None
    
    def get_next_memorization_session(self, obj):
        """Get the next planned memorization session for this student"""
        if obj.memorization_method == "chapter":
            # Get the latest MEMORIZATION chapter completion with a next_surah planned
            latest = obj.completed_chapters.filter(
                session_type='memorization',
                next_surah__isnull=False
            ).order_by('-created_at').first()
            
            if latest and latest.next_surah:
                session_text = f"{latest.next_surah.name}"
                if latest.next_verse_from and latest.next_verse_to:
                    session_text += f" ({latest.next_verse_from}-{latest.next_verse_to})"
                return session_text
        else:
            # Get the latest MEMORIZATION quarter completion with a next_hizb planned
            latest = obj.completed_quarters.filter(
                session_type='memorization',
                next_hizb_number__isnull=False
            ).order_by('-created_at').first()
            
            if latest and latest.next_hizb_number:
                session_text = f"الحزب{latest.next_hizb_number}"
                if latest.next_eighth_number:
                    session_text += f" الثمن{latest.next_eighth_number}"
                return session_text
        
        return None

    class Meta:
        model = Student
        fields = [
            "code",
            "name",
            "first_name",
            "last_name",
            "gender",
            "age",
            "memorization_method",
            "date_of_registration",
            "next_review_session",
            "next_memorization_session",
        ]
