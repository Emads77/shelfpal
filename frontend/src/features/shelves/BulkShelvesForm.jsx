import { useEffect, useId, useRef, useState } from "react";
import Button from "../../shared/ui/Button.jsx";
import { errorMessage } from "./errorMessage.js";
import { pluralize } from "./pluralize.js";
import { MAX_SHELVES, suggestShelfNames } from "./shelfNames.js";
import "./shelves.css";

const DEFAULT_COUNT = 3;

export default function BulkShelvesForm({
  bookcaseName,
  existingNames,
  onSubmit,
  onCancel,}) {
  const [countText, setCountText] = useState(String(DEFAULT_COUNT));
  const [names, setNames] = useState(() =>
  suggestShelfNames(bookcaseName, existingNames, DEFAULT_COUNT),
    );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const id = useId();
  const countRef = useRef(null);

  useEffect(() => {
    countRef.current?.focus();
  }, []);

  function handleCountChange(event) {
    const text = event.target.value;
    setCountText(text);

    const count = Number.parseInt(text, 10);
    if (!Number.isInteger(count) || count < 1) return;

    const wanted = Math.min(count, MAX_SHELVES);
    setNames((previous) =>
    wanted <= previous.length
    ? previous.slice(0, wanted)
    : [
        ...previous,
        ...suggestShelfNames(
          bookcaseName,
          [...existingNames, ...previous],
          wanted - previous.length,
        ),
      ],
    );
  }

  function handleNameChange(index, value) {
    setNames((previous) => previous.map((n, i) => (i === index ? value : n)));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cleaned = names.map((name) => name.trim());

    if (cleaned.some((name) => name === "")) {
      setError("Every shelf must have a name.");
      return;
    }
    if (new Set(cleaned).size !== cleaned.length) {
      setError("Each name can only be used once.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit(cleaned);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="bulk-form"
      noValidate
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <h3 className="bulk-form__title">Add several shelves</h3>

      <div className="bulk-form__count">
        <label htmlFor={`${id}-count`} className="bulk-form__label">
          How many shelves?
        </label>
        <input
          id={`${id}-count`}
          ref={countRef}
          className="name-form__input"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_SHELVES}
          value={countText}
          readOnly={saving}
          onChange={handleCountChange}
        />
      </div>

      <ul className="bulk-form__names">
        {names.map((name, index) => (
          <li key={index}>
            <label htmlFor={`${id}-${index}`} className="bulk-form__label">
              Shelf {index + 1} name
            </label>
            <input
              id={`${id}-${index}`}
              className="name-form__input"
              type="text"
              value={name}
              maxLength={200}
              autoComplete="off"
              readOnly={saving}
              onChange={(event) => handleNameChange(index, event.target.value)}
            />
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="name-form__error">
          {error}
        </p>
      )}

      <div className="name-form__actions">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Adding..."
            : `Add ${pluralize(names.length, "shelf", "shelves")}`}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
