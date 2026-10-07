import { useEffect, useId, useRef, useState } from "react";
import Button from "../../shared/ui/Button.jsx";
import { errorMessage } from "./errorMessage.js";
import "./bookcases.css";

export default function NameForm({
  label,
  placeholder,
  initialValue = "",
  submitLabel,
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
  inputRef,
  autoFocus = false,
  stayOpen = false,
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const id = useId();
  const ownRef = useRef(null);
  const ref = inputRef ?? ownRef;

  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [autoFocus, ref]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    if (onCancel && !stayOpen && trimmed === initialValue) {
      onCancel();
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit(trimmed);
      if (stayOpen) {
        setValue("");
        ref.current?.focus();
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form className="name-form" noValidate onSubmit={handleSubmit}>
      <div className="name-form__field">
        <label htmlFor={id} className="visually-hidden">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          className="name-form__input"
          type="text"
          value={value}
          maxLength={200}
          autoComplete="off"
          placeholder={placeholder}
          readOnly={saving}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="name-form__error">
            {error}
          </p>
        )}
      </div>
      <div className="name-form__actions">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
