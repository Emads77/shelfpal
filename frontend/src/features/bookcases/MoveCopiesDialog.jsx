import { useEffect, useId, useRef, useState } from "react";
import Button from "../../shared/ui/Button.jsx";
import "../../shared/ui/confirm-dialog.css";
import { errorMessage } from "./errorMessage.js";
import { pluralize } from "./pluralize.js";
import "./bookcases.css";
import "./copies.css";

export default function MoveCopiesDialog({
  count,
  bookcases,
  currentShelfId,
  onMove,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const selectId = useId();
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const canUnassign = currentShelfId !== null;
  const withShelves = bookcases.filter(
    (bookcase) => bookcase.shelves.length > 0,
  );
  const hasTargets =
    canUnassign ||
    withShelves.some((bookcase) =>
      bookcase.shelves.some((shelf) => shelf.id !== currentShelfId),
    );

  async function handleSubmit(event) {
    event.preventDefault();
    if (!target) {
      setError("Choose where to move the books.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onMove(target === "unassigned" ? null : Number(target));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

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
      <form noValidate onSubmit={handleSubmit}>
        <h2 id={titleId} className="confirm-dialog__title">
          Move {pluralize(count, "book")}
        </h2>

        {hasTargets ? (
          <div className="move-dialog__field">
            <label htmlFor={selectId} className="move-dialog__label">
              Move to
            </label>
            <select
              id={selectId}
              className="name-form__input"
              value={target}
              disabled={busy}
              aria-invalid={error ? "true" : undefined}
              onChange={(event) => {
                setTarget(event.target.value);
                setError("");
              }}
            >
              <option value="">Choose a shelf</option>
              {canUnassign && (
                <option value="unassigned">Unassigned (no shelf)</option>
              )}
              {withShelves.map((bookcase) => (
                <optgroup key={bookcase.id} label={bookcase.name}>
                  {bookcase.shelves.map((shelf) => (
                    <option
                      key={shelf.id}
                      value={shelf.id}
                      disabled={shelf.id === currentShelfId}
                    >
                      {shelf.name}
                      {shelf.id === currentShelfId ? " (current)" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        ) : (
          <p className="confirm-dialog__text">
            There is nowhere to move to yet. Add another shelf first.
          </p>
        )}

        {error && (
          <p role="alert" className="name-form__error move-dialog__error">
            {error}
          </p>
        )}

        <div className="confirm-dialog__actions">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          {hasTargets && (
            <Button type="submit" disabled={busy}>
              {busy ? "Moving..." : "Move"}
            </Button>
          )}
        </div>
      </form>
    </dialog>
  );
}
