/**
 * components/ButtonPanel
 *
 * The desktop button bar: six blue buttons in the exact desktop order
 * (Add Data / Show Data / Update / Delete / Reset / Exit).
 *
 * Presentational -- driven by callback props from the page/hook:
 *   onAdd, onShow, onUpdate, onDelete, onReset, onExit
 *   disabled  optional boolean (e.g. while a save is in flight)
 *
 * Exit reproduces the desktop askyesno confirm: it opens an MUI Dialog and
 * only calls onExit if the user confirms. (MUI is used here for the dialog,
 * per "Material UI only where necessary".)
 */

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import styles from "./ButtonPanel.module.css";

export default function ButtonPanel({
  onAdd,
  onShow,
  onUpdate,
  onDelete,
  onReset,
  onExit,
  disabled = false,
}) {
  const [confirmExit, setConfirmExit] = useState(false);

  // Buttons in the exact desktop order.
  const buttons = [
    { label: "Add Data", onClick: onAdd },
    { label: "Show Data", onClick: onShow },
    { label: "Update", onClick: onUpdate },
    { label: "Delete", onClick: onDelete },
    { label: "Reset", onClick: onReset },
    { label: "Exit", onClick: () => setConfirmExit(true) },
  ];

  const handleConfirmExit = () => {
    setConfirmExit(false);
    if (onExit) onExit();
  };

  return (
    <>
      <div className={styles.bar} role="group" aria-label="Actions">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            className={styles.button}
            onClick={b.onClick}
            disabled={disabled}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Exit confirmation (desktop askyesno equivalent) */}
      <Dialog open={confirmExit} onClose={() => setConfirmExit(false)}>
        <DialogTitle>Library Management System</DialogTitle>
        <DialogContent>
          <DialogContentText>Do you want to exit?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmExit(false)}>No</Button>
          <Button onClick={handleConfirmExit} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
