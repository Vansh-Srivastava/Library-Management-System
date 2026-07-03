/**
 * components/Notification
 *
 * Replaces the desktop messagebox popups. A thin wrapper over MUI's Snackbar +
 * Alert that shows the hook's `notice` and dismisses via `clearNotice`.
 *
 * Props (from the useLibrary hook):
 *   notice       { severity: "success" | "error" | "info", message } | null
 *   onClose      () => void   (the hook's clearNotice)
 *   autoHideMs   optional auto-dismiss delay (default 4000ms; null disables)
 *
 * MUI is used here deliberately, per "Material UI only where necessary"
 * (notifications/alerts).
 */

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

export default function Notification({ notice, onClose, autoHideMs = 4000 }) {
  const open = Boolean(notice);

  const handleClose = (_event, reason) => {
    // Don't dismiss on click-away so users can read errors; timeout/close only.
    if (reason === "clickaway") return;
    if (onClose) onClose();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideMs}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      {/* Snackbar requires a single child; render only when there's a notice. */}
      {notice ? (
        <Alert
          onClose={handleClose}
          severity={notice.severity || "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notice.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
}
