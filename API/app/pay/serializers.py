from rest_framework import serializers
from .models import Payment
from stu.models import Student


class StudentPaymentSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ["date", "amount"]

    def get_date(self, obj):
        return f"{obj.month}-{obj.year}"


class PaymentCreateSerializer(serializers.ModelSerializer):
    """
    Alternative: Simplified serializer for POST requests only
    Use this if you want more control over input/output
    """

    class Meta:
        model = Payment
        fields = ["year", "month", "amount"]

    def validate_month(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError("Month must be between 1 and 12")
        return value

    def validate_year(self, value):
        if value < 2000 or value > 2100:
            raise serializers.ValidationError("Year must be between 2000 and 2100")
        return value


class DoctorPaymentSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ["student_name", "amount"]

    def get_student_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_amount(self, obj):
        """
        Get the total payment amount for the student.
        """
        if hasattr(obj, "monthly_payment") and obj.monthly_payment:
            return float(obj.monthly_payment[0].amount)
        return 0.0


class get_all_payments_serializer(serializers.Serializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
