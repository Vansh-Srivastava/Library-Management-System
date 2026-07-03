/**
 * components/BookList
 *
 * The desktop right panel: "Book Details".
 *
 * Presentational only -- driven by props from the useLibrary hook:
 *   books          array of catalog books ({ id, BookTitle, BookId, ... })
 *   onSelectBook   (bookId) => void   called when a title is clicked (autofill)
 *   showText       string shown in the read-only text area ("Show Data" output)
 *   loading        optional boolean -> shows a loading hint in the list
 *
 * Layout mirrors the Tkinter panel: a scrollable Listbox of titles on the
 * left and a large read-only Text area on the right. Selecting a book
 * highlights it and triggers autofill, exactly like the desktop SelectBook.
 */

import { useState } from "react";

import styles from "./BookList.module.css";

export default function BookList({
  books = [],
  onSelectBook,
  showText = "",
  loading = false,
}) {
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = (book) => {
    setSelectedId(book.id);
    if (onSelectBook) onSelectBook(book.id);
  };

  return (
    <section className={styles.panel} aria-label="Book Details">
      <span className={styles.legend}>Book Details</span>

      <div className={styles.body}>
        <ul className={styles.list} role="listbox" aria-label="Book list">
          {loading && <li className={styles.empty}>Loading books…</li>}

          {!loading && books.length === 0 && (
            <li className={styles.empty}>No books available.</li>
          )}

          {!loading &&
            books.map((book) => {
              const isSelected = book.id === selectedId;
              return (
                <li
                  key={book.id}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.item} ${isSelected ? styles.itemSelected : ""}`}
                  onClick={() => handleSelect(book)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(book);
                    }
                  }}
                  tabIndex={0}
                  title={book.BookTitle}
                >
                  {book.BookTitle}
                </li>
              );
            })}
        </ul>

        <textarea
          className={styles.textbox}
          value={showText}
          readOnly
          aria-label="Book and member details output"
        />
      </div>
    </section>
  );
}
