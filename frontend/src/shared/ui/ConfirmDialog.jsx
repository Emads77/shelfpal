import { useEffect, useId, useRef } from "react";
import Button from "./Button.jsx";
import "./confirm-dialog.css";

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busy = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={titleId} className="confirm-dialog__title">
        {title}
      </h2>
      <p className="confirm-dialog__text">{children}</p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="confirm-dialog__actions">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Deleting..." : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
