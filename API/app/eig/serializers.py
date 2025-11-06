from rest_framework import serializers
from .models import CompletedQuarter


class create_quarter_completion_serializer(serializers.ModelSerializer):
    class Meta:
        fields = [
            "session_type",
            "quarter",
            "hizb_number",
            "eighth_number",
            "is_hizb_completed",
            "completion_date",
            "rating",
            "quick_notes",
            "evaluation",
            "progress",
            "feedback",
            "next_hizb_number",
            "next_eighth_number",
        ]
        model = CompletedQuarter


class update_quarter_completion_serializer(serializers.ModelSerializer):
    class Meta:
        fields = [
            "session_type",
            "quarter",
            "hizb_number",
            "eighth_number",
            "is_hizb_completed",
            "completion_date",
            "rating",
            "quick_notes",
            "evaluation",
            "progress",
            "feedback",
            "next_hizb_number",
            "next_eighth_number",
        ]
        model = CompletedQuarter


class delete_quarter_completion_serializer(serializers.ModelSerializer):
    class Meta:
        fields = ["code", "student"]
        model = CompletedQuarter


class list_quarter_completion_serializer(serializers.ModelSerializer):
    quarter = serializers.SerializerMethodField()

    def get_quarter(self, obj):
        return obj.quarter.name if obj.quarter else None

    class Meta:
        fields = [
            "code",
            "session_type",
            "quarter",
            "hizb_number",
            "eighth_number",
            "is_hizb_completed",
            "completion_date",
            "rating",
            "quick_notes",
            "evaluation",
            "progress",
            "feedback",
            "next_hizb_number",
            "next_eighth_number",
            "created_at",
        ]
        model = CompletedQuarter
