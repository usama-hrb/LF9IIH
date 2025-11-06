from django.urls import path
from . import views

urlpatterns = [
    path(
        "create",
        views.create_quarter_completion_view.as_view(),
        name="create_completion",
    ),
    path(
        "delete/<int:code>",
        views.delete_quarter_completion_view.as_view(),
        name="delete_completion",
    ),
    path(
        "update/<int:code>",
        views.update_quarter_completion_view.as_view(),
        name="update_completion",
    ),
    path(
        "completions",
        views.list_quarter_completion_view.as_view(),
        name="list_completions",
    ),
]
