/**
 * services/api.js
 *
 * Configured Axios instance shared by the whole app. Every service module
 * (libraryService, bookService, ...) imports this so base URL, headers,
 * timeout, and error handling live in exactly one place.
 *
 * Design notes
 * ------------
 * - Base URL comes from an environment variable (VITE_API_BASE_URL), mirroring
 *   the backend's env-based config. Defaults to the Django dev server so it
 *   works out of the box. No hardcoded hosts scattered through the code
 *   (unlike the desktop app, which repeated its DB credentials everywhere).
 * - A response interceptor normalizes every error into a consistent shape
 *   { message, status, data, fieldErrors } so UI components (e.g. the
 *   Notification banner) can render DRF validation messages uniformly instead
 *   of dealing with raw Axios error objects.
 */

import axios from "axios";

const BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Turn any Axios error into a predictable object the UI can display.
 *
 * DRF returns validation errors as either a string, a list, or a dict of
 * field -> [messages]. We surface a single human-readable `message` plus the
 * raw `fieldErrors` dict so a form can highlight individual fields if it wants.
 */
function normalizeError(error) {
  // The request was made and the server responded with a non-2xx status.
  if (error.response) {
    const { status, data } = error.response;

    let message = `Request failed (${status}).`;
    let fieldErrors = null;

    if (typeof data === "string") {
      message = data;
    } else if (data && typeof data === "object") {
      // DRF non-field errors.
      if (data.detail) {
        message = data.detail;
      } else {
        fieldErrors = data;
        // Build a readable summary from the first field error.
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          const text = Array.isArray(val) ? val.join(" ") : String(val);
          message = `${firstKey}: ${text}`;
        }
      }
    }

    return { message, status, data, fieldErrors };
  }

  // The request was made but no response was received.
  if (error.request) {
    return {
      message:
        "No response from the server. Is the backend running at " +
        BASE_URL +
        "?",
      status: 0,
      data: null,
      fieldErrors: null,
    };
  }

  // Something happened setting up the request.
  return {
    message: error.message || "Unexpected error.",
    status: -1,
    data: null,
    fieldErrors: null,
  };
}

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeError(error))
);

export default api;
export { BASE_URL, normalizeError };
