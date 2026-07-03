"""
library/admin.py

Django admin registration for the normalized models (Member, Book, Loan).

Each admin is tuned for real use: searchable identity/catalog fields, useful
list columns, filters on the low-cardinality fields, and autocomplete on the
Loan foreign keys (which relies on search_fields being defined on MemberAdmin
and BookAdmin). Timestamp fields are read-only.
"""

from django.contrib import admin

from .models import Book, Loan, Member


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = (
        "prn_no", "id_no", "member_type",
        "first_name", "last_name", "mobile",
    )
    list_filter = ("member_type",)
    search_fields = ("prn_no", "id_no", "first_name", "last_name", "mobile")
    ordering = ("prn_no",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Identity", {
            "fields": ("member_type", "prn_no", "id_no"),
        }),
        ("Personal details", {
            "fields": ("first_name", "last_name", "mobile"),
        }),
        ("Address", {
            "fields": ("address1", "address2", "post_code"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = (
        "book_code", "title", "author",
        "default_loan_days", "default_fine", "default_price",
    )
    search_fields = ("book_code", "title", "author")
    ordering = ("title",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Book", {
            "fields": ("book_code", "title", "author"),
        }),
        ("Catalog defaults", {
            "fields": ("default_loan_days", "default_fine", "default_price"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = (
        "id", "member", "book",
        "date_borrowed", "date_due", "days_on_book",
        "late_return_fine", "date_over_due", "final_price",
    )
    list_filter = ("date_over_due", "date_borrowed")
    search_fields = (
        "member__prn_no", "member__id_no",
        "member__first_name", "member__last_name",
        "book__book_code", "book__title", "book__author",
    )
    # Autocomplete keeps the FK selectors usable as the tables grow; relies on
    # the search_fields defined on MemberAdmin and BookAdmin above.
    autocomplete_fields = ("member", "book")
    date_hierarchy = "date_borrowed"
    ordering = ("-date_borrowed",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Loan", {
            "fields": ("member", "book"),
        }),
        ("Dates", {
            "fields": ("date_borrowed", "date_due", "days_on_book", "date_over_due"),
        }),
        ("Amounts", {
            "fields": ("late_return_fine", "final_price"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        # Avoid N+1 in the changelist when rendering member/book columns.
        return super().get_queryset(request).select_related("member", "book")
