"""
library/models.py

Production-ready, normalized data model for the Library Management System.

The original desktop app stored everything in ONE flat `library` table where
every column was varchar(45): member identity, book catalog data, and the
borrowing transaction were all mixed together and re-typed on every record.

This module replaces that with three normalized tables while keeping the
application's behavior and appearance identical (the API layer re-flattens
these into the single 18-field shape the desktop form and table expect).

Why three tables (3NF)
----------------------
* Member : who borrows. Stored once; no more re-typing name/address per loan.
* Book   : the catalog. The 18 books that were hardcoded in Python now live
           here as seed data (single source of truth for the right-panel list
           and the SelectBook autofill).
* Loan   : the borrowing event linking a Member to a Book, carrying the
           per-transaction values (dates, days, fine, price) that the desktop
           form auto-fills but keeps editable.

Why this is better than the legacy schema
------------------------------------------
1. Real primary keys: each table has a surrogate AutoField `id`. The legacy
   composite (PRN_NO, ID) confusion -- and the bug where update/delete keyed on
   PRN_NO alone and could clobber every row sharing that PRN -- is gone. Each
   row is now addressable unambiguously.
2. Correct field types: dates are DateTimeField, money is DecimalField,
   counts are IntegerField, the overdue yes/no flag is BooleanField. These can
   be validated, sorted, and compared -- impossible when everything was a string.
3. Referential integrity: Loan has real ForeignKeys to Member and Book with
   PROTECT, so you cannot orphan a loan or delete a member/book that is still
   referenced.
4. Uniqueness enforced properly: PRN and ID number are unique on Member;
   book_code is unique on Book -- enforced by the database, not by hand.
5. Django owns the schema (managed=True): real migrations, rollback, and
   reproducibility instead of a hand-maintained SQL dump.

Behavior/appearance preservation
--------------------------------
* Member type choices match the desktop combobox exactly.
* Money is stored as Decimal (e.g. 50.00). The desktop displayed "Rs.50";
  the UI/serializer re-adds the "Rs." prefix for display, so nothing looks
  different to the user.
* days_on_book, fine, and price live on Loan because the desktop form lets the
  user edit them per transaction after autofill -- the Book table only supplies
  the defaults.
"""

import django
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models


def _check_constraint(*, condition, name):
    """
    CheckConstraint compatibility shim.

    Django 5.x uses the `check=` keyword; Django 6.0 renamed it to `condition=`
    (with `check=` deprecated). This helper picks the right keyword for the
    installed version so the same models.py runs on both.
    """
    if django.VERSION >= (5, 1):
        return models.CheckConstraint(condition=condition, name=name)
    return models.CheckConstraint(check=condition, name=name)


# Reused validator: mobile numbers are digits, optional leading +, 7-15 long.
phone_validator = RegexValidator(
    regex=r"^\+?\d{7,15}$",
    message="Enter a valid mobile number (7-15 digits, optional leading +).",
)


class Member(models.Model):
    """A library member. Stored once and reused across many loans."""

    class MemberType(models.TextChoices):
        ADMIN_STAFF = "Admin Staf", "Admin Staf"   # spelling kept to match desktop combobox
        STUDENT = "Student", "Student"
        LECTURER = "Lecturer", "Lecturer"

    member_type = models.CharField(
        max_length=20,
        choices=MemberType.choices,
        default=MemberType.ADMIN_STAFF,
    )
    prn_no = models.CharField(
        "PRN number", max_length=45, unique=True,
        help_text="Unique PRN. Enforced at the DB level (no more duplicates).",
    )
    id_no = models.CharField(
        "ID number", max_length=45, unique=True,
    )
    first_name = models.CharField(max_length=45, blank=True)
    last_name = models.CharField(max_length=45, blank=True)
    address1 = models.CharField(max_length=45, blank=True)
    address2 = models.CharField(max_length=45, blank=True)
    post_code = models.CharField(max_length=45, blank=True)
    mobile = models.CharField(
        max_length=15, blank=True, validators=[phone_validator],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "member"
        ordering = ["prn_no"]
        verbose_name = "Member"
        verbose_name_plural = "Members"

    def __str__(self):
        return f"{self.prn_no} - {self.first_name} {self.last_name}".strip()


class Book(models.Model):
    """The book catalog. Seeded with the 18 titles once hardcoded in Python."""

    book_code = models.CharField(
        "Book ID", max_length=45, unique=True,
        help_text="External book code, e.g. BKID5454. Unique.",
    )
    title = models.CharField(max_length=100)
    author = models.CharField(max_length=100, blank=True)

    # Catalog defaults. The desktop autofill copies these into a new Loan,
    # where they remain editable per transaction.
    default_loan_days = models.PositiveIntegerField(
        default=15,
        help_text="Default borrowing period in days (desktop used 15).",
    )
    default_fine = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="Default late-return fine as a decimal amount (stored without 'Rs.').",
    )
    default_price = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="Default actual price as a decimal amount (stored without 'Rs.').",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "book"
        ordering = ["title"]
        verbose_name = "Book"
        verbose_name_plural = "Books"

    def __str__(self):
        return f"{self.book_code} - {self.title}"


class Loan(models.Model):
    """
    A borrowing transaction: one Member borrows one Book.

    This is the row the desktop's bottom table shows and its form edits. The
    per-loan snapshot fields (dates, days, fine, price) are auto-filled from the
    selected Book but remain editable, exactly like the desktop workflow.
    """

    member = models.ForeignKey(
        Member, on_delete=models.PROTECT, related_name="loans",
    )
    book = models.ForeignKey(
        Book, on_delete=models.PROTECT, related_name="loans",
    )

    date_borrowed = models.DateTimeField(
        help_text="Real timestamp. Desktop set this to 'today' on book select.",
    )
    date_due = models.DateTimeField(
        help_text="Real timestamp. Desktop set this to borrowed + loan days.",
    )
    days_on_book = models.PositiveIntegerField(default=15)

    late_return_fine = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="Per-loan fine as decimal. UI adds the 'Rs.' prefix for display.",
    )
    # Legacy stored the string "NO"/"YES"; a boolean is the correct type.
    date_over_due = models.BooleanField(
        default=False,
        help_text="True if the loan is overdue (legacy 'YES'/'NO' flag).",
    )
    final_price = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="Per-loan actual price as decimal. UI adds 'Rs.' for display.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "loan"
        ordering = ["-date_borrowed"]
        verbose_name = "Loan"
        verbose_name_plural = "Loans"
        constraints = [
            # A book can only be out to one member at a time on a given instant.
            models.UniqueConstraint(
                fields=["book", "date_borrowed"],
                name="unique_book_borrow_instant",
            ),
            _check_constraint(
                condition=models.Q(days_on_book__gte=0),
                name="loan_days_non_negative",
            ),
        ]

    def __str__(self):
        return f"Loan #{self.pk}: {self.member.prn_no} -> {self.book.book_code}"
