from django.urls import path
from . import views

urlpatterns = [
    path(
        "create",
        views.create_chapter_completion_view.as_view(),
        name="create_completion",
    ),
    path(
        "delete/<int:code>",
        views.delete_chapter_completion_view.as_view(),
        name="delete_completion",
    ),
    path(
        "update/<int:code>",
        views.update_chapter_completion_view.as_view(),
        name="update_completion",
    ),
    path(
        "completions",
        views.list_chapter_completion_view.as_view(),
        name="list_completions",
    ),
    path(
        "surahs",
        views.list_surahs_view.as_view(),
        name="list_surahs",
    ),
]
