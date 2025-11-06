from rest_framework import generics
from .models import CompletedQuarter
from django.utils.decorators import method_decorator
from stu.views import student_action_decorator
from api.views import authentication_decorator
from api.serializers import created_serializer, success_serializer
from rest_framework.response import Response
from .serializers import (
    create_quarter_completion_serializer,
    update_quarter_completion_serializer,
    delete_quarter_completion_serializer,
    list_quarter_completion_serializer,
)
from api.serializers import code_serializer
from rest_framework import status


class create_quarter_completion_view(generics.CreateAPIView):
    queryset = CompletedQuarter.objects.all()
    serializer_class = create_quarter_completion_serializer

    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def create(self, request, *args, **kwargs):
        """
        Create a new quarter completion record
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(student=request.student)
        code = code_serializer(data={"code": serializer.instance.code})
        code.is_valid(raise_exception=False)
        return Response(code.data, status=status.HTTP_201_CREATED)


class update_quarter_completion_view(generics.UpdateAPIView):
    queryset = CompletedQuarter.objects.all()
    serializer_class = update_quarter_completion_serializer
    lookup_field = "code"

    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def update(self, request, *args, **kwargs):
        """
        Update a quarter completion record
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        success = created_serializer(data={})
        success.is_valid(raise_exception=False)
        return Response(success.data)


class delete_quarter_completion_view(generics.DestroyAPIView):
    queryset = CompletedQuarter.objects.all()
    serializer_class = delete_quarter_completion_serializer
    lookup_field = "code"

    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def delete(self, request, *args, **kwargs):
        """
        Delete a quarter completion record
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        success = success_serializer(data={})
        success.is_valid(raise_exception=False)
        return Response(success.data)


class list_quarter_completion_view(generics.GenericAPIView):
    queryset = CompletedQuarter.objects.all()
    serializer_class = list_quarter_completion_serializer

    @method_decorator(authentication_decorator)
    @method_decorator(student_action_decorator)
    def get(self, request, *args, **kwargs):
        """
        List quarter completion records for a student
        """
        queryset = CompletedQuarter.objects.filter(student=request.student)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
