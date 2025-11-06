from rest_framework import serializers
import bcrypt
from .utils import validate_password
from .models import Doctor


class get_me_serializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ["code", "first_name", "last_name", "phone_number", "email"]


class reset_password_serializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)


class login_serializer(serializers.Serializer):
    code = serializers.CharField(max_length=12)


class signup_serializer(serializers.ModelSerializer):
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

    def validate_email(self, value):
        return value

    def validate_password(self, value):
        ok, msg = validate_password(value)
        if not ok:
            raise serializers.ValidationError(msg)
        return bcrypt.hashpw(value.encode("utf-8"), bcrypt.gensalt())

    def validate(self, data):
        return data

    class Meta:
        model = Doctor
        fields = ["first_name", "last_name", "phone_number", "email", "password"]


class code_serializer(serializers.Serializer):
    code = serializers.CharField(max_length=12)


class token_serializer(serializers.Serializer):
    #! Development purpose only
    code = serializers.CharField(max_length=12)
    access = serializers.CharField(max_length=800)
    refresh = serializers.CharField(max_length=800)


class success_serializer(serializers.Serializer):
    message = serializers.CharField(default="Success")
    code = serializers.IntegerField(default=200)
    status = serializers.CharField(default="OK")


class created_serializer(serializers.Serializer):
    message = serializers.CharField(default="Success")
    code = serializers.IntegerField(default=201)
    status = serializers.CharField(default="Created")
