/**
 * services/libraryService.js
 *
 * API call functions for the library backend, built on the shared Axios
 * instance. Each function returns plain data (not the Axios response) so the
 * useLibrary hook and components stay free of transport details.
 *
 * The backend paginates list endpoints (PAGE_SIZE = 50), so list responses
 * look like { count, results: [...] }. unwrapList() normalizes both the
 * paginated and bare-array shapes to a plain array, so callers always get a
 * list regardless of pagination settings.
 *
 * All loan objects use the flat 18-field desktop shape (Member, PRN_NO,
 * Auther, "Rs.788", "YES"/"NO", ...) exactly as the form and table expect.
 */

import api from "./api.js";

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

// --- Loans (the bottom table + form CRUD) --------------------------------

/** GET all loan records (flat 18-field rows). Backs Show Data / the table. */
export async function getLoans() {
  const { data } = await api.get("/loans/");
  return unwrapList(data);
}

/** GET a single loan by id. */
export async function getLoan(id) {
  const { data } = await api.get(`/loans/${id}/`);
  return data;
}

/** POST a new loan record (Add Data). `payload` is the flat 18-field object. */
export async function addLoan(payload) {
  const { data } = await api.post("/loans/", payload);
  return data;
}

/** PUT an update to an existing loan by id (Update). */
export async function updateLoan(id, payload) {
  const { data } = await api.put(`/loans/${id}/`, payload);
  return data;
}

/** DELETE a loan by id (Delete). Returns nothing on success (204). */
export async function deleteLoan(id) {
  await api.delete(`/loans/${id}/`);
}

// --- Books (the right-hand panel + autofill) -----------------------------

/** GET the book catalog for the right-panel list. */
export async function getBooks() {
  const { data } = await api.get("/books/");
  return unwrapList(data);
}

/**
 * GET the desktop SelectBook autofill for one book: returns book fields plus
 * computed borrow/due dates, days, fine ("Rs."-prefixed), and price.
 */
export async function getBookAutofill(bookId) {
  const { data } = await api.get(`/books/${bookId}/autofill/`);
  return data;
}

export default {
  getLoans,
  getLoan,
  addLoan,
  updateLoan,
  deleteLoan,
  getBooks,
  getBookAutofill,
};
