import { useCallback, useEffect, useRef, useState } from "react";
import { Library, Plus } from "lucide-react";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import Button from "../../shared/ui/Button.jsx";
import EmptyState from "../../shared/ui/EmptyState.jsx";
import PageHeader from "../../shared/ui/PageHeader.jsx";
import {
  createBookcase,
  createShelves,
  getLibraryOverview,
  removeBookcase,
  removeShelf,
  updateBookcase,
  updateShelf,
} from "./api.js";
import BookcaseCard from "./BookcaseCard.jsx";
import NameForm from "./NameForm.jsx";
import { pluralize } from "./pluralize.js";
import "./bookcases.css";

export default function BookcasesPage() {
  usePageTitle("Bookcases");

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [openIds, setOpenIds] = useState(() => new Set());
  const [adding, setAdding] = useState(false);
  const [pendingFocusId, setPendingFocusId] = useState(null);
  const addButtonRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getLibraryOverview()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setLoadError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  }

  const refresh = useCallback(async () => {
    try {
      setOverview(await getLibraryOverview());
    } catch (err) {
      setLoadError(err);
    }
  }, []);

  async function mutate(action) {
    const result = await action();
    await refresh();
    return result;
  }

  const handleAutoFocused = useCallback(() => setPendingFocusId(null), []);

  function toggle(bookcaseId) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookcaseId)) next.delete(bookcaseId);
      else next.add(bookcaseId);
      return next;
    });
  }

  async function handleAddBookcase(name) {
    const created = await mutate(() => createBookcase(name));
    setOpenIds((prev) => new Set(prev).add(created.id));
    setPendingFocusId(created.id);
    setAdding(false);
  }

  async function handleDeleteBookcase(bookcaseId) {
    await mutate(() => removeBookcase(bookcaseId));
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.delete(bookcaseId);
      return next;
    });
    setTimeout(() => addButtonRef.current?.focus(), 0);
  }

  const bookcases = overview?.bookcases ?? [];
  const ready = !loading && !loadError;

  let subtitle;
  if (loading) subtitle = "Loading your bookcases...";
  else if (overview && !loadError) {
    const shelfCount = bookcases.reduce((sum, b) => sum + b.shelf_count, 0);
    const bookCount =
      bookcases.reduce((sum, b) => sum + b.book_count, 0) +
      overview.unassigned_count;
    subtitle = [
      pluralize(bookcases.length, "bookcase"),
      pluralize(shelfCount, "shelf", "shelves"),
      pluralize(bookCount, "book"),
    ].join(" · ");
  }

  return (
    <section>
      <PageHeader
        eyebrow="Your library"
        title="Bookcases"
        subtitle={subtitle}
        actions={
          ready ? (
            <Button ref={addButtonRef} onClick={() => setAdding(true)}>
              <Plus size={18} aria-hidden="true" />
              Add bookcase
            </Button>
          ) : null
        }
      />

      {loading && <p role="status">Loading your bookcases...</p>}

      {loadError && (
        <div role="alert" className="bookcases-error">
          <p className="form-error">
            Couldn't load your bookcases. Check your connection and try again.
          </p>
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {ready && adding && (
        <section className="card add-bookcase" aria-labelledby="add-bookcase-title">
          <h2 id="add-bookcase-title" className="add-bookcase__title">
            New bookcase
          </h2>
          <NameForm
            label="Bookcase name"
            placeholder="e.g. Living room"
            submitLabel="Add bookcase"
            autoFocus
            onSubmit={handleAddBookcase}
            onCancel={() => {
              setAdding(false);
              addButtonRef.current?.focus();
            }}
          />
        </section>
      )}

      {ready && bookcases.length === 0 && !adding && (
        <EmptyState
          icon={Library}
          title="No bookcases yet"
          action={
            <Button onClick={() => setAdding(true)}>
              <Plus size={18} aria-hidden="true" />
              Add your first bookcase
            </Button>
          }
        >
          Bookcases and shelves should mirror the ones in your home, so you can find your books easily.
        </EmptyState>
      )}

      {ready && bookcases.length > 0 && (
        <ul className="bookcase-list">
          {bookcases.map((bookcase) => (
            <BookcaseCard
              key={bookcase.id}
              bookcase={bookcase}
              open={openIds.has(bookcase.id)}
              onToggle={() => toggle(bookcase.id)}
              onRename={(name) =>
                mutate(() => updateBookcase(bookcase.id, name))
              }
              onDelete={() => handleDeleteBookcase(bookcase.id)}
              onAddShelves={(names) =>
                mutate(() => createShelves(bookcase.id, names))
              }
              onRenameShelf={(shelfId, name) =>
                mutate(() => updateShelf(bookcase.id, shelfId, name))
              }
              onDeleteShelf={(shelfId) =>
                mutate(() => removeShelf(bookcase.id, shelfId))
              }
              autoFocusAddShelf={pendingFocusId === bookcase.id}
              onAutoFocused={handleAutoFocused}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
