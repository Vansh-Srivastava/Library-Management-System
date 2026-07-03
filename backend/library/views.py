"""
library/views.py

REST API views for the Library Management System.

Endpoints
---------
* LoanViewSet   -> /api/loans/         full CRUD on borrowing records.
                   Each row is serialized into the flat 18-field desktop shape.
                   Backs Add Data / Show Data / Update / Delete and the table.
* BookViewSet   -> /api/books/         read-only catalog for the right panel.
                   + /api/books/{pk}/autofill/  replicates the desktop
                     SelectBook behavior: fills book fields and computes the
                     borrow/due dates, days, fine, and price.

Design notes
------------
* select_related on loans avoids N+1 queries when flattening member/book.
* Autofill logic lives here (driven by Book rows) instead of the hardcoded
  if/elif chain the desktop used -- same result, single source of truth.
* Money is returned "Rs."-prefixed and dates ISO-formatted so the React form
  populates exactly like the desktop.
"""

import datetime

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Book, Loan
from .serializers import (
    BookSerializer,
    LoanSerializer,
    money_to_display,
)


class LoanViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for borrowing records, exposed in the flat 18-field shape.

    - GET    /api/loans/         list all records (bottom table / Show Data)
    - POST   /api/loans/         add a record (Add Data)
    - GET    /api/loans/{pk}/    retrieve one
    - PUT    /api/loans/{pk}/    update (keyed on the specific loan id)
    - DELETE /api/loans/{pk}/    delete
    """

    serializer_class = LoanSerializer

    def get_queryset(self):
        # select_related keeps the flat serialization to a single query per row.
        return Loan.objects.select_related("member", "book").all()


class BookViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only catalog for the right-hand 'Book Details' panel.

    - GET /api/books/                list the catalog (the desktop's book list)
    - GET /api/books/{pk}/           retrieve one book
    - GET /api/books/{pk}/autofill/  desktop SelectBook: fields + computed dates
    """

    queryset = Book.objects.all()
    serializer_class = BookSerializer

    @action(detail=True, methods=["get"])
    def autofill(self, request, pk=None):
        """
        Replicate the desktop SelectBook behavior for one book.

        Returns the book fields plus computed borrow/due dates so the React
        form can populate every book-related field in one call, exactly like
        clicking a title in the desktop list did.
        """
        book = self.get_object()

        borrowed = datetime.datetime.now()
        due = borrowed + datetime.timedelta(days=book.default_loan_days)

        data = {
            "BookId": book.book_code,
            "BookTitle": book.title,
            "Auther": book.author,
            "Dateborrowed": borrowed.isoformat(),
            "DateDue": due.isoformat(),
            "DayOnBook": book.default_loan_days,
            "LaterReturnFine": money_to_display(book.default_fine),
            "DateOverDue": "NO",
            "FinalPrice": money_to_display(book.default_price),
        }
        return Response(data)
