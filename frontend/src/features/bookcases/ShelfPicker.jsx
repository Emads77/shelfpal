import { Plus } from "lucide-react";
import { useState } from "react";
import NameForm from "./NameForm.jsx";
import "./shelf-picker.css";

export default function ShelfPicker({
  picker,
  disabled = false,
  errors,
  onChange,
}) {
  const { bookcases, shelf, setShelf, addBookcase, addShelf } = picker;
  const [mode, setMode] = useState(null);
  const [targetId, setTargetId] = useState("");
  const [notice, setNotice] = useState("");

  const selectedBookcase = bookcases.find((b) =>
    b.shelves.some((s) => String(s.id) === shelf),
  );

  function close() {
    setMode(null);
    setNotice("");
  }

  function openBookcase() {
    setNotice("");
    setMode("bookcase");
  }

  function openShelf() {
    setNotice("");
    setTargetId(String((selectedBookcase ?? bookcases[0]).id));
    setMode("shelf");
  }

  async function handleAddBookcase(name) {
    const bookcase = await addBookcase(name);
    setTargetId(String(bookcase.id));
    setNotice(`Bookcase "${name}" created. Add a shelf to it.`);
    setMode("shelf");
  }

  async function handleAddShelf(name) {
    await addShelf(Number(targetId), name);
    onChange?.();
    close();
  }

  return (
    <div className="shelf-picker">
      <div className="add-book__field">
        <label htmlFor="shelf">Shelf</label>
        <select
          id="shelf"
          name="shelf"
          value={shelf}
          disabled={disabled}
          aria-invalid={Boolean(errors?.length)}
          aria-describedby={errors?.length ? "shelf-error" : undefined}
          onChange={(e) => {
            setShelf(e.target.value);
            onChange?.();
          }}
        >
          <option value="">No shelf (unassigned)</option>
          {bookcases.map((bookcase) => (
            <optgroup key={bookcase.id} label={bookcase.name}>
              {bookcase.shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {errors?.length > 0 && (
          <p id="shelf-error" className="field-error">
            {errors.join(" ")}
          </p>
        )}
      </div>

      {!mode && !disabled && (
        <div className="shelf-picker__actions">
          <button
            type="button"
            className="shelf-picker__link"
            onClick={openBookcase}
          >
            <Plus size={16} aria-hidden="true" />
            New bookcase
          </button>
          {bookcases.length > 0 && (
            <button
              type="button"
              className="shelf-picker__link"
              onClick={openShelf}
            >
              <Plus size={16} aria-hidden="true" />
              New shelf
            </button>
          )}
        </div>
      )}

      {mode && (
        <div className="shelf-picker__create">
          {notice && <p className="shelf-picker__notice">{notice}</p>}

          {mode === "shelf" && (
            <>
              <label htmlFor="new_shelf_bookcase">Bookcase</label>
              <select
                id="new_shelf_bookcase"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                {bookcases.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <NameForm
            key={mode}
            nested
            autoFocus
            label={mode === "bookcase" ? "Bookcase name" : "Shelf name"}
            placeholder={
              mode === "bookcase" ? "e.g. Living room" : "e.g. Top shelf"
            }
            submitLabel={mode === "bookcase" ? "Add bookcase" : "Add shelf"}
            onSubmit={mode === "bookcase" ? handleAddBookcase : handleAddShelf}
            onCancel={close}
          />
        </div>
      )}
    </div>
  );
}
