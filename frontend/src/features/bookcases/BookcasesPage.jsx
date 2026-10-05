import { useEffect, useState } from "react";
import {
  getBookcases,
  createBookcase,
  removeBookcase,
  updateBookcase,
} from "./api.js";
import { Link } from "react-router";

export default function BookcasesPage() {
  const [bookcases, setBookcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getBookcases();
        setBookcases(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const created = await createBookcase({ name });
      setBookcases([...bookcases, created]);
      setName("");
    } catch (err) {
      setFormError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await removeBookcase(id);
      setBookcases(bookcases.filter((b) => b.id !== id));
    } catch (err) {
      setFormError(err);
    }
  }

  function startEdit(bookcase) {
    setEditingId(bookcase.id);
    setEditingName(bookcase.name);
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleUpdate(id) {
    if (!editingName.trim()) return;
    try {
      const updated = await updateBookcase(id, editingName);
      setBookcases(bookcases.map((b) => (b.id === id ? updated : b)));
      cancelEdit();
    } catch (err) {
      setFormError(err);
    }
  }

  return (
    <section>
      <h1>Bookcases</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="bookcase-name">Name</label>
        <input
          id="bookcase-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
        />
        <button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Adding..." : "Add bookcase"}
        </button>
      </form>

      {formError && (
        <p role="alert">{formError.data?.name ?? formError.message}</p>
      )}
      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error.message}</p>}
      {!loading && !error && bookcases.length === 0 && (
        <p>No bookcases yet. Add your first one above.</p>
      )}
      {!loading && !error && bookcases.length > 0 && (
        <ul>
          {bookcases.map((b) => (
            <li key={b.id}>
              {editingId === b.id ? (
                <>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    aria-label="Bookcase name"
                  />
                  <button type="button" onClick={() => handleUpdate(b.id)}>
                    Save
                  </button>
                  <button type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <Link to={`/bookcases/${b.id}/shelves`}>{b.name}</Link>

                  <button type="button" onClick={() => startEdit(b)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(b.id)}>
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
