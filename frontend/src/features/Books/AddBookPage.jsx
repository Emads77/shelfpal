import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router";
import Button from "../../shared/ui/Button.jsx";
import { getLibraryOverview } from "../bookcases/api.js";
import { errorMessage } from "../bookcases/errorMessage.js";
import { addBookManually } from "../bookcases/api.js";
import "./books.css";

const EMPTY_FORM = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  cover: "",
  shelf: "",
};

export default function AddBookPage() {
  const navigate = useNavigate();
  const id = useId();
  const [form, setForm] = useState(EMPTY_FORM);
  const [bookcases, setBookcases] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getLibraryOverview()
      .then((overview) => setBookcases(overview.bookcases))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  function pathFor(shelfId) {
    if (shelfId === null) return "/bookcases/unassigned";
    const bookcase = bookcases.find((b) =>
      b.shelves.some((s) => s.id === shelfId),
    );
    return bookcase
      ? `/bookcases/${bookcase.id}/shelves/${shelfId}`
      : "/bookcases";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const title = form.title.trim();
    const author = form.author.trim();

    if (!title) {
      setError("Title is required.");
      return;
    }
    if (!author) {
      setError("Author is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const copy = await addBookManually({
        title,
        author,
        isbn: form.isbn.trim(),
        publisher: form.publisher.trim(),
        cover: form.cover.trim(),
        shelf: form.shelf === "" ? null : Number(form.shelf),
      });
      navigate(pathFor(copy.shelf));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form className="add-book" noValidate onSubmit={handleSubmit}>
      <h1>Add a book</h1>

      <div className="add-book__field">
        <label htmlFor={`${id}-title`}>Title</label>
        <input
          id={`${id}-title`}
          type="text"
          maxLength={200}
          value={form.title}
          readOnly={saving}
          onChange={(e) => update("title", e.target.value)}
        />
      </div>

      <div className="add-book__field">
        <label htmlFor={`${id}-author`}>Author</label>
        <input
          id={`${id}-author`}
          type="text"
          maxLength={200}
          value={form.author}
          readOnly={saving}
          onChange={(e) => update("author", e.target.value)}
        />
      </div>

      <div className="add-book__field">
        <label htmlFor={`${id}-isbn`}>ISBN (optional)</label>
        <input
          id={`${id}-isbn`}
          type="text"
          maxLength={17}
          value={form.isbn}
          readOnly={saving}
          onChange={(e) => update("isbn", e.target.value)}
        />
      </div>

      <div className="add-book__field">
        <label htmlFor={`${id}-publisher`}>Publisher (optional)</label>
        <input
          id={`${id}-publisher`}
          type="text"
          maxLength={200}
          value={form.publisher}
          readOnly={saving}
          onChange={(e) => update("publisher", e.target.value)}
        />
      </div>

      <div className="add-book__field">
        <label htmlFor={`${id}-cover`}>Cover URL (optional)</label>
        <input
          id={`${id}-cover`}
          type="url"
          value={form.cover}
          readOnly={saving}
          onChange={(e) => update("cover", e.target.value)}
        />
      </div>

      <div className="add-book__field">
        <label htmlFor={`${id}-shelf`}>Shelf</label>
        <select
          id={`${id}-shelf`}
          value={form.shelf}
          disabled={saving}
          onChange={(e) => update("shelf", e.target.value)}
        >
          <option value="">No shelf (unshelved)</option>
          {bookcases.map((bookcase) => (
            <optgroup key={bookcase.id} label={bookcase.name}>
              {bookcase.shelves.map((shelf) => (
                <option key={shelf.id} value={shelf.id}>
                  {shelf.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="add-book__error">
          {error}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Add book"}
      </Button>
    </form>
  );
}
