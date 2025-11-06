from rest_framework import serializers
from .models import CompletedChapter


class create_chapter_completion_serializer(serializers.ModelSerializer):
    class Meta:
        fields = [
            "session_type",
            "chapter",
            "surah",
            "verse_from",
            "verse_to",
            "is_surah_completed",
            "completion_date",
            "rating",
            "quick_notes",
            "evaluation",
            "progress",
            "feedback",
            "next_surah",
            "next_verse_from",
            "next_verse_to",
        ]
        model = CompletedChapter


class update_chapter_completion_serializer(serializers.ModelSerializer):
    class Meta:
        fields = [
            "session_type",
            "chapter",
            "surah",
            "verse_from",
            "verse_to",
            "is_surah_completed",
            "completion_date",
            "rating",
            "quick_notes",
            "evaluation",
            "progress",
            "feedback",
            "next_surah",
            "next_verse_from",
            "next_verse_to",
        ]
        model = CompletedChapter


class delete_chapter_completion_serializer(serializers.ModelSerializer):
    class Meta:
        fields = ["code", "student"]
        model = CompletedChapter


class list_chapter_completion_serializer(serializers.ModelSerializer):
    chapter = serializers.SerializerMethodField()
    surah = serializers.SerializerMethodField()
    next_surah = serializers.SerializerMethodField()

    def get_chapter(self, obj):
        return obj.chapter.name if obj.chapter else None

    def get_surah(self, obj):
        return {"code": obj.surah.code, "name": obj.surah.name} if obj.surah else None

    def get_next_surah(self, obj):
        return {"code": obj.next_surah.code, "name": obj.next_surah.name} if obj.next_surah else None

    class Meta:
        fields = [
            "code",
            "session_type",
            "chapter",
            "surah",
            "verse_from",
            "verse_to",
            "is_surah_completed",
            "completion_date",
            "rating",
            "quick_notes",
            "evaluation",
            "progress",
            "feedback",
            "next_surah",
            "next_verse_from",
            "next_verse_to",
            "created_at",
        ]
        model = CompletedChapter
