"""
Data migration: seed the book catalog from the desktop's 18 list labels.

The desktop right-panel Listbox showed exactly 18 labels. Clicking a label ran
SelectBook, which for 8 of them set a book id, (sometimes different) title,
author, fine, and price; the other 10 labels had no branch and did nothing.

We seed one Book per list label (18 rows), so the catalog matches the desktop
list one-to-one. For the 8 labels with defined data we store that data exactly
(including cases where SelectBook's title differs from the label). For the 10
undefined labels we store the label as the title with a generated code and zero
fine/price, making them selectable -- an improvement that invents no data the
desktop actually had.

Latent desktop bug repaired: the label "Into Machine tecno" never fired because
its branch checked "Into Machine Learning". We attach that intended data to the
label so it now works.

Amounts are plain Decimals; the API/UI adds the "Rs." prefix for display.
"""

from django.db import migrations


# One entry per desktop list label, in list order.
# label -> (book_code, stored_title, author, loan_days, fine, price)
# For undefined labels, book_code/author/fine/price are None and are generated.
BOOKS = [
    ("Head Firt Book",               ("BKID5454", "Python Manual", "Paul Berry", 15, 50, 788)),
    ("Learn Python The Hard Way",    ("BKID5567", "Basic Of Python", "ZED A.SHAW", 15, 25, 755)),
    ("Python Programming",           ("BKID3665", "Into The Python Comp Science", "John Zhelie", 15, 25, 500)),
    ("Secrete Rahshy",               ("BKID7577", "Basic Python", "Ref.kapil Kamble", 15, 25, 285)),
    ("Python CookBook",              ("BKID6367", "Python CookBook", "Brian Jones", 15, 25, 354)),
    ("Into Machine tecno",           ("BKID8657", "Into Machine Learning", "Sarah Guaido", 15, 25, 466)),
    ("My Python",                    ("BKID3767", "My Python", "Smith Jonse", 15, 25, 866)),
    ("Joss Ellif guru",              ("BKID1197", "Joss Ellif guru", "Sarah Jone", 15, 25, 400)),
    ("Elite Jungle python",          None),
    ("Jungli Python'Machine python", None),
    ("Advance Python",               None),
    ("Inton Python",                 None),
    ("RedChilli Python",             None),
    ("Ishq Python",                  None),
    ("Python Learning",              None),
    ("Codeing Guide",                None),
    ("Light Java",                   None),
    ("Info State",                   None),
]


def seed_books(apps, schema_editor):
    Book = apps.get_model("library", "Book")
    gen = 1
    for label, data in BOOKS:
        if data is not None:
            code, title, author, days, fine, price = data
        else:
            code = f"BKID9{gen:03d}"   # generated codes in a distinct 9xxx range
            gen += 1
            title, author, days, fine, price = label, "", 15, 0, 0
        Book.objects.update_or_create(
            book_code=code,
            defaults={
                "title": title,
                "author": author,
                "default_loan_days": days,
                "default_fine": fine,
                "default_price": price,
            },
        )


def unseed_books(apps, schema_editor):
    """Reverse: remove only the rows this migration created."""
    Book = apps.get_model("library", "Book")
    defined_codes = [d[0] for _, d in BOOKS if d is not None]
    Book.objects.filter(book_code__in=defined_codes).delete()
    Book.objects.filter(book_code__startswith="BKID9").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("library", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_books, unseed_books),
    ]
