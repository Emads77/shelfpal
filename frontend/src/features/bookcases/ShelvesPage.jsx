import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  getShelves,
  createShelf,
  updateShelf,
  removeShelf,
  getBookcase,
} from "./api.js";

export default function ShelvesPage() {
  const { bookcaseId } = useParams();

  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [bookcase, setBookcase] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const bc = await getBookcase(bookcaseId);
        setBookcase(bc);
        const data = await getShelves(bookcaseId);
        setShelves(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookcaseId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const created = await createShelf(bookcaseId, name);
      setShelves([...shelves, created]);
      setName("");
    } catch (err) {
      setFormError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setFormError(null);
    try {
      await removeShelf(bookcaseId, id);
      setShelves(shelves.filter((s) => s.id !== id));
    } catch (err) {
      setFormError(err);
    }
  }

  function startEdit(shelf) {
    setEditingId(shelf.id);
    setEditingName(shelf.name);
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleUpdate(id) {
    if (!editingName.trim()) return;
    try {
      const updated = await updateShelf(bookcaseId, id, editingName);
      setShelves(shelves.map((s) => (s.id === id ? updated : s)));
      cancelEdit();
    } catch (err) {
      setFormError(err);
    }
  }

  return (
    <section>
      <p>
        <Link to="/bookcases">Back to bookcases</Link>
      </p>
      <h1>Shelves{bookcase ? ` in ${bookcase.name}` : ""}</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="shelf-name">Name</label>
        <input
          id="shelf-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
        />
        <button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Adding..." : "Add shelf"}
        </button>
      </form>

      {formError && (
        <p role="alert">{formError.data?.name ?? formError.message}</p>
      )}

      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error.data?.detail ?? error.message}</p>}
      {!loading && !error && shelves.length === 0 && (
        <p>No shelves yet. Add your first one above.</p>
      )}
      {!loading && !error && shelves.length > 0 && (
        <ul>
          {shelves.map((s) => (
            <li key={s.id}>
              {editingId === s.id ? (
                <>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    aria-label="Shelf name"
                  />
                  <button type="button" onClick={() => handleUpdate(s.id)}>
                    Save
                  </button>
                  <button type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {s.name}
                  <button type="button" onClick={() => startEdit(s)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(s.id)}>
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
