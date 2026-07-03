/**
 * hooks/useLibrary.js
 *
 * The application "brain" -- the React equivalent of the Tkinter
 * LibraryManagementSystem class. It owns all form state and the operations the
 * six desktop buttons triggered, so the UI components can stay presentational.
 *
 * Exposes:
 *   form, setField, setForm        - the 18 desktop fields (+ hidden id)
 *   loans, books                   - table rows and the right-panel catalog
 *   loading (booleans)             - loans/books/saving flags for spinners
 *   notice, clearNotice            - MUI notification state
 *   selectBook(bookId)             - desktop SelectBook autofill
 *   selectRow(row)                 - fill the form from a clicked table row
 *   addRecord/updateRecord/deleteRecord/resetForm/refreshLoans
 *   showData                       - the desktop "Show Data" text dump
 *
 * Field names match the flat 18-field API shape exactly, so form values map
 * 1:1 to request payloads with no translation.
 */

import { useCallback, useEffect, useState } from "react";

import {
  addLoan,
  deleteLoan,
  getBookAutofill,
  getBooks,
  getLoans,
  updateLoan,
} from "../services/libraryService.js";

// The 18 desktop fields, in desktop order. `id` is hidden bookkeeping so
// Update/Delete can target the exact loan row (the backend keys on id).
export const EMPTY_FORM = {
  id: null,
  Member: "Admin Staf", // matches the desktop combobox default (index 0)
  PRN_NO: "",
  ID: "",
  FirstName: "",
  LastName: "",
  Address1: "",
  Address2: "",
  PostId: "",
  Mobile: "",
  BookId: "",
  BookTitle: "",
  Auther: "",
  Dateborrowed: "",
  DateDue: "",
  DayOnBook: "",
  LaterReturnFine: "",
  DateOverDue: "",
  FinalPrice: "",
};

// Keys sent to the API (everything except the local-only `id`).
const API_FIELDS = Object.keys(EMPTY_FORM).filter((k) => k !== "id");

export default function useLibrary() {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);

  const [loading, setLoading] = useState({
    loans: false,
    books: false,
    saving: false,
  });

  // notice: { severity: "success" | "error" | "info", message: string } | null
  const [notice, setNotice] = useState(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  const setLoadingFlag = useCallback((key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  // --- Field helpers ------------------------------------------------------
  const setField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_FORM });
  }, []);

  // --- Data loading -------------------------------------------------------
  const refreshLoans = useCallback(async () => {
    setLoadingFlag("loans", true);
    try {
      setLoans(await getLoans());
    } catch (err) {
      setNotice({ severity: "error", message: err.message || "Failed to load records." });
    } finally {
      setLoadingFlag("loans", false);
    }
  }, [setLoadingFlag]);

  const refreshBooks = useCallback(async () => {
    setLoadingFlag("books", true);
    try {
      setBooks(await getBooks());
    } catch (err) {
      setNotice({ severity: "error", message: err.message || "Failed to load books." });
    } finally {
      setLoadingFlag("books", false);
    }
  }, [setLoadingFlag]);

  // Initial load (table + book list), like the desktop app on startup.
  useEffect(() => {
    refreshLoans();
    refreshBooks();
  }, [refreshLoans, refreshBooks]);

  // --- Book autofill (desktop SelectBook) ---------------------------------
  const selectBook = useCallback(async (bookId) => {
    if (!bookId) return;
    try {
      const data = await getBookAutofill(bookId);
      // Merge only the book-derived fields; keep member fields intact.
      setForm((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setNotice({ severity: "error", message: err.message || "Autofill failed." });
    }
  }, []);

  // --- Fill form from a clicked table row (desktop get_cursor) ------------
  const selectRow = useCallback((row) => {
    if (!row) return;
    // Take only known fields so stray keys never leak into the form.
    const next = { ...EMPTY_FORM };
    for (const key of Object.keys(EMPTY_FORM)) {
      if (key in row) next[key] = row[key];
    }
    next.id = row.id ?? null;
    setForm(next);
  }, []);

  // --- Validation (mirrors desktop: required PRN + ID, no empty record) ---
  const validate = useCallback((f) => {
    if (!f.PRN_NO.trim() || !f.ID.trim()) {
      return "PRN No and ID No are required.";
    }
    if (!f.BookId.trim()) {
      return "Select a book before saving.";
    }
    if (f.Mobile && !/^\+?\d{7,15}$/.test(f.Mobile.trim())) {
      return "Enter a valid mobile number (7-15 digits).";
    }
    return null;
  }, []);

  const buildPayload = useCallback((f) => {
    const payload = {};
    for (const key of API_FIELDS) payload[key] = f[key];
    return payload;
  }, []);

  // --- CRUD operations (the desktop buttons) ------------------------------
  const addRecord = useCallback(async () => {
    const error = validate(form);
    if (error) {
      setNotice({ severity: "error", message: error });
      return false;
    }
    setLoadingFlag("saving", true);
    try {
      await addLoan(buildPayload(form));
      await refreshLoans();
      resetForm();
      setNotice({ severity: "success", message: "Member has been inserted successfully." });
      return true;
    } catch (err) {
      setNotice({ severity: "error", message: err.message || "Insert failed." });
      return false;
    } finally {
      setLoadingFlag("saving", false);
    }
  }, [form, validate, buildPayload, refreshLoans, resetForm, setLoadingFlag]);

  const updateRecord = useCallback(async () => {
    if (form.id == null) {
      setNotice({ severity: "error", message: "First select a record from the table." });
      return false;
    }
    const error = validate(form);
    if (error) {
      setNotice({ severity: "error", message: error });
      return false;
    }
    setLoadingFlag("saving", true);
    try {
      await updateLoan(form.id, buildPayload(form));
      await refreshLoans();
      resetForm();
      setNotice({ severity: "success", message: "Member has been updated." });
      return true;
    } catch (err) {
      setNotice({ severity: "error", message: err.message || "Update failed." });
      return false;
    } finally {
      setLoadingFlag("saving", false);
    }
  }, [form, validate, buildPayload, refreshLoans, resetForm, setLoadingFlag]);

  const deleteRecord = useCallback(async () => {
    if (form.id == null) {
      setNotice({ severity: "error", message: "First select a record from the table." });
      return false;
    }
    setLoadingFlag("saving", true);
    try {
      await deleteLoan(form.id);
      await refreshLoans();
      resetForm();
      setNotice({ severity: "success", message: "Member has been deleted." });
      return true;
    } catch (err) {
      setNotice({ severity: "error", message: err.message || "Delete failed." });
      return false;
    } finally {
      setLoadingFlag("saving", false);
    }
  }, [form, refreshLoans, resetForm, setLoadingFlag]);

  // --- Show Data (desktop text dump of the current form) ------------------
  const showData = useCallback(() => {
    const labels = [
      ["Member Type", form.Member],
      ["PRN No", form.PRN_NO],
      ["ID No", form.ID],
      ["Firstname", form.FirstName],
      ["Lastname", form.LastName],
      ["Address1", form.Address1],
      ["Address2", form.Address2],
      ["Post Code", form.PostId],
      ["Mobile No", form.Mobile],
      ["Book No", form.BookId],
      ["Book Title", form.BookTitle],
      ["Auther", form.Auther],
      ["Date Borrowed", form.Dateborrowed],
      ["Date Due", form.DateDue],
      ["Days On Book", form.DayOnBook],
      ["Late Return Fine", form.LaterReturnFine],
      ["Date Over Due", form.DateOverDue],
      ["Actual Price", form.FinalPrice],
    ];
    return labels.map(([k, v]) => `${k}:\t${v ?? ""}`).join("\n");
  }, [form]);

  return {
    // state
    form,
    loans,
    books,
    loading,
    notice,
    // field helpers
    setField,
    setForm,
    resetForm,
    clearNotice,
    // data
    refreshLoans,
    refreshBooks,
    // interactions
    selectBook,
    selectRow,
    showData,
    // CRUD
    addRecord,
    updateRecord,
    deleteRecord,
  };
}
