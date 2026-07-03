"""
library/serializers.py

The seam between the normalized database (Member / Book / Loan) and the flat,
18-field shape the desktop UI expects.

Why this matters
----------------
The Tkinter app used ONE flat row: one form, one 18-column table. The database
is now normalized into three tables. Rather than change the UI, these
serializers re-flatten the data on read and re-split it on write, so the React
form and table can use the exact same field names and layout as the desktop.

Three serializers
-----------------
* BookSerializer   : the catalog (right-panel list + autofill source).
* MemberSerializer : member identity (standalone CRUD if needed).
* LoanSerializer   : the flat 18-field representation of a borrowing record.
                     This is what the desktop's table rows and form map to.

Presentation preservation
--------------------------
* Money: stored as Decimal (e.g. 50.00), shown to the UI as "Rs.50" exactly
  like the desktop. Converted both directions here.
* Overdue: stored as BooleanField, shown as "YES"/"NO" strings.
* Output keys use the original desktop column names (Member, PRN_NO, Auther,
  DayOnBook, ...) so the React components bind without changes.
"""

from decimal import Decimal, InvalidOperation

from django.db import transaction
from rest_framework import serializers

from .models import Book, Loan, Member


# --- Money / flag conversion helpers -------------------------------------
def money_to_display(value):
    """Decimal(50.00) -> 'Rs.50'  |  Decimal(78.50) -> 'Rs.78.5'."""
    if value is None:
        return ""
    # Normalize: drop trailing zeros but keep it readable, matching desktop feel.
    d = Decimal(value)
    # Show as integer when whole, else trimmed decimal.
    text = f"{d.normalize():f}"
    return f"Rs.{text}"


def money_to_decimal(value):
    """'Rs.50' / '50' / 50 -> Decimal('50'). Blank -> Decimal('0')."""
    if value in (None, "", "NULL"):
        return Decimal("0")
    if isinstance(value, (int, float, Decimal)):
        return Decimal(str(value))
    cleaned = str(value).strip().replace("Rs.", "").replace("Rs", "").strip()
    if cleaned == "":
        return Decimal("0")
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        raise serializers.ValidationError(f"Invalid money value: {value!r}")


def overdue_to_display(flag):
    return "YES" if flag else "NO"


def overdue_to_bool(value):
    if isinstance(value, bool):
        return value
    return str(value).strip().upper() in {"YES", "TRUE", "1", "Y"}


# --- Simple serializers ---------------------------------------------------
class BookSerializer(serializers.ModelSerializer):
    """Catalog serializer. Exposes desktop-style keys plus display money."""

    BookId = serializers.CharField(source="book_code")
    BookTitle = serializers.CharField(source="title")
    Auther = serializers.CharField(source="author", required=False, allow_blank=True)
    DayOnBook = serializers.IntegerField(source="default_loan_days", required=False)
    LaterReturnFine = serializers.SerializerMethodField()
    FinalPrice = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id", "BookId", "BookTitle", "Auther",
            "DayOnBook", "LaterReturnFine", "FinalPrice",
        ]

    def get_LaterReturnFine(self, obj):
        return money_to_display(obj.default_fine)

    def get_FinalPrice(self, obj):
        return money_to_display(obj.default_price)


class MemberSerializer(serializers.ModelSerializer):
    """Member identity serializer with desktop-style keys."""

    Member = serializers.CharField(source="member_type")
    PRN_NO = serializers.CharField(source="prn_no")
    ID = serializers.CharField(source="id_no")
    FirstName = serializers.CharField(source="first_name", required=False, allow_blank=True)
    LastName = serializers.CharField(source="last_name", required=False, allow_blank=True)
    Address1 = serializers.CharField(source="address1", required=False, allow_blank=True)
    Address2 = serializers.CharField(source="address2", required=False, allow_blank=True)
    PostId = serializers.CharField(source="post_code", required=False, allow_blank=True)
    Mobile = serializers.CharField(source="mobile", required=False, allow_blank=True)

    class Meta:
        model = Member
        fields = [
            "id", "Member", "PRN_NO", "ID", "FirstName", "LastName",
            "Address1", "Address2", "PostId", "Mobile",
        ]


# --- The flat 18-field loan serializer -----------------------------------
class LoanSerializer(serializers.Serializer):
    """
    Flat representation of a borrowing record, matching the desktop's 18
    columns. Reads by traversing Loan -> member / book; writes by resolving
    (or creating) the related Member and Book, then the Loan.
    """

    id = serializers.IntegerField(read_only=True)

    # --- Member fields ---
    Member = serializers.CharField()
    PRN_NO = serializers.CharField()
    ID = serializers.CharField()
    FirstName = serializers.CharField(required=False, allow_blank=True, default="")
    LastName = serializers.CharField(required=False, allow_blank=True, default="")
    Address1 = serializers.CharField(required=False, allow_blank=True, default="")
    Address2 = serializers.CharField(required=False, allow_blank=True, default="")
    PostId = serializers.CharField(required=False, allow_blank=True, default="")
    Mobile = serializers.CharField(required=False, allow_blank=True, default="")

    # --- Book fields ---
    BookId = serializers.CharField()
    BookTitle = serializers.CharField(required=False, allow_blank=True, default="")
    Auther = serializers.CharField(required=False, allow_blank=True, default="")

    # --- Loan fields ---
    Dateborrowed = serializers.DateTimeField(source="date_borrowed")
    DateDue = serializers.DateTimeField(source="date_due")
    DayOnBook = serializers.IntegerField(source="days_on_book", required=False, default=15)
    LaterReturnFine = serializers.CharField(required=False, allow_blank=True, default="Rs.0")
    DateOverDue = serializers.CharField(required=False, allow_blank=True, default="NO")
    FinalPrice = serializers.CharField(required=False, allow_blank=True, default="Rs.0")

    # ---- READ: flatten Loan -> flat dict --------------------------------
    def to_representation(self, instance):
        m = instance.member
        b = instance.book
        return {
            "id": instance.id,
            "Member": m.member_type,
            "PRN_NO": m.prn_no,
            "ID": m.id_no,
            "FirstName": m.first_name,
            "LastName": m.last_name,
            "Address1": m.address1,
            "Address2": m.address2,
            "PostId": m.post_code,
            "Mobile": m.mobile,
            "BookId": b.book_code,
            "BookTitle": b.title,
            "Auther": b.author,
            "Dateborrowed": instance.date_borrowed.isoformat() if instance.date_borrowed else "",
            "DateDue": instance.date_due.isoformat() if instance.date_due else "",
            "DayOnBook": instance.days_on_book,
            "LaterReturnFine": money_to_display(instance.late_return_fine),
            "DateOverDue": overdue_to_display(instance.date_over_due),
            "FinalPrice": money_to_display(instance.final_price),
        }

    # ---- Helpers for write ----------------------------------------------
    def _resolve_member(self, data):
        """Get or create the Member by PRN, updating identity fields."""
        member, _ = Member.objects.update_or_create(
            prn_no=data["PRN_NO"],
            defaults={
                "member_type": data["Member"],
                "id_no": data["ID"],
                "first_name": data.get("FirstName", ""),
                "last_name": data.get("LastName", ""),
                "address1": data.get("Address1", ""),
                "address2": data.get("Address2", ""),
                "post_code": data.get("PostId", ""),
                "mobile": data.get("Mobile", ""),
            },
        )
        return member

    def _resolve_book(self, data):
        """Get or create the Book by its code, updating title/author."""
        book, _ = Book.objects.get_or_create(
            book_code=data["BookId"],
            defaults={
                "title": data.get("BookTitle", ""),
                "author": data.get("Auther", ""),
            },
        )
        return book

    # ---- WRITE: split flat dict -> Member / Book / Loan -----------------
    @transaction.atomic
    def create(self, validated_data):
        member = self._resolve_member(validated_data)
        book = self._resolve_book(validated_data)
        loan = Loan.objects.create(
            member=member,
            book=book,
            date_borrowed=validated_data["date_borrowed"],
            date_due=validated_data["date_due"],
            days_on_book=validated_data.get("days_on_book", 15),
            late_return_fine=money_to_decimal(validated_data.get("LaterReturnFine")),
            date_over_due=overdue_to_bool(validated_data.get("DateOverDue", "NO")),
            final_price=money_to_decimal(validated_data.get("FinalPrice")),
        )
        return loan

    @transaction.atomic
    def update(self, instance, validated_data):
        member = self._resolve_member(validated_data)
        book = self._resolve_book(validated_data)
        instance.member = member
        instance.book = book
        instance.date_borrowed = validated_data.get("date_borrowed", instance.date_borrowed)
        instance.date_due = validated_data.get("date_due", instance.date_due)
        instance.days_on_book = validated_data.get("days_on_book", instance.days_on_book)
        if "LaterReturnFine" in validated_data:
            instance.late_return_fine = money_to_decimal(validated_data["LaterReturnFine"])
        if "DateOverDue" in validated_data:
            instance.date_over_due = overdue_to_bool(validated_data["DateOverDue"])
        if "FinalPrice" in validated_data:
            instance.final_price = money_to_decimal(validated_data["FinalPrice"])
        instance.save()
        return instance
