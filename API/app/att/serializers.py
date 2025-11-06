from rest_framework import serializers
from datetime import date
from .models import Attendance


class attendance_serializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ["attendance_date", "state"]

    def validate_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Date cannot be in the future.")
        return value


class date_serializer(serializers.Serializer):
    date = serializers.DateField()
