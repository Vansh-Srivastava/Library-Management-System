"""
library/urls.py

Routes the library app's API endpoints under /api/ (the config project mounts
this module at that prefix).

A DRF DefaultRouter generates the standard REST routes for each viewset and
automatically picks up custom @action methods (e.g. the book 'autofill').

Generated routes
----------------
  /api/loans/                     GET (list), POST (create)
  /api/loans/{pk}/                GET, PUT, PATCH, DELETE
  /api/books/                     GET (list)
  /api/books/{pk}/                GET (retrieve)
  /api/books/{pk}/autofill/       GET (desktop SelectBook behavior)
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BookViewSet, LoanViewSet

app_name = "library"

router = DefaultRouter()
router.register("loans", LoanViewSet, basename="loan")
router.register("books", BookViewSet, basename="book")

urlpatterns = [
    path("", include(router.urls)),
]
