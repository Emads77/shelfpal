import { useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, BookOpen, Inbox, Library } from "lucide-react";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import Button from "../../shared/ui/Button.jsx";
import ConfirmDialog from "../../shared/ui/ConfirmDialog.jsx";
import EmptyState from "../../shared/ui/EmptyState.jsx";
import PageHeader from "../../shared/ui/PageHeader.jsx";
import { deleteCopies, moveCopies } from "./api.js";
import CopyCard from "./CopyCard.jsx";
import MoveCopiesDialog from "./MoveCopiesDialog.jsx";
import SelectionBar from "./SelectionBar.jsx";
import { errorMessage } from "./errorMessage.js";
import { pluralize } from "./pluralize.js";
import { useCopiesView } from "./useCopiesView.js";
import { useSelection } from "./useSelection.js";
import "./copies.css";

function describeTarget(bookcases, shelfId) {
  if (shelfId === null) return "Unassigned";
  for (const bookcase of bookcases) {
    const shelf = bookcase.shelves.find((item) => item.id === shelfId);
    if (shelf) return `${bookcase.name} · ${shelf.name}`;
  }
  return "the chosen shelf";
}

// shelfId === null shows the books that are not on a shelf.
export default function BookListPage({ shelfId = null, bookcaseId = null }) {
  const { overview, copies, loading, error, retry, reload } =
    useCopiesView(shelfId);
  const { selected, toggle, selectAll, clear } = useSelection();
  const [selecting, setSelecting] = useState(false);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const listRef = useRef(null);
  const backRef = useRef(null);
  const selectButtonRef = useRef(null);

  const unassignedView = shelfId === null;
  const bookcase = overview?.bookcases.find((item) => item.id === bookcaseId);
  const shelf = bookcase?.shelves.find((item) => item.id === shelfId);
  const missing =
    !unassignedView &&
    (error?.status === 404 || (!loading && !error && !shelf));
  const ready = !loading && !error && !missing;

  const selectedCopies = copies.filter((copy) => selected.has(copy.id));
  const allSelected =
    copies.length > 0 && selectedCopies.length === copies.length;

  usePageTitle(unassignedView ? "Unassigned" : (shelf?.name ?? "Shelf"));

  const title = unassignedView ? "Unassigned" : (shelf?.name ?? "Shelf");
  const eyebrow = unassignedView
    ? "Bookcases"
    : (bookcase?.name ?? "Bookcases");
  const subtitle = ready
    ? unassignedView
      ? `${pluralize(copies.length, "book")} not on a shelf`
      : pluralize(copies.length, "book")
    : undefined;

  function focusAfterChange() {
    setTimeout(() => (listRef.current ?? backRef.current)?.focus(), 0);
  }

  function stopSelecting() {
    setSelecting(false);
    clear();
  }

  function handleToggleSelecting() {
    if (selecting) {
      stopSelecting();
    } else {
      setNotice("");
      setSelecting(true);
    }
  }

  function handleCancelSelecting() {
    stopSelecting();
    selectButtonRef.current?.focus();
  }

  function handleToggleAll() {
    if (allSelected) {
      clear();
    } else {
      selectAll(copies.map((copy) => copy.id));
    }
  }

  function askMove(ids) {
    setPending({ kind: "move", ids });
  }

  function askDelete(selectedList) {
    setActionError("");
    setPending({
      kind: "delete",
      ids: selectedList.map((copy) => copy.id),
      title:
        selectedList.length === 1
          ? `Delete “${selectedList[0].book.title}”?`
          : `Delete ${pluralize(selectedList.length, "book")}?`,
      several: selectedList.length > 1,
    });
  }

  async function handleMove(targetShelfId) {
    const { ids } = pending;
    const targetName = describeTarget(overview.bookcases, targetShelfId);
    await moveCopies(ids, targetShelfId);
    await reload();
    setNotice(`Moved ${pluralize(ids.length, "book")} to ${targetName}.`);
    stopSelecting();
    setPending(null);
    focusAfterChange();
  }

  async function handleDelete() {
    const { ids } = pending;
    setBusy(true);
    setActionError("");
    try {
      await deleteCopies(ids);
      await reload();
      setNotice(`Deleted ${pluralize(ids.length, "book")}.`);
      stopSelecting();
      setPending(null);
      focusAfterChange();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <Link ref={backRef} to="/bookcases" className="back-link">
        <ArrowLeft size={18} aria-hidden="true" />
        Bookcases
      </Link>

      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

      {loading && <p role="status">Loading your books...</p>}

      {error && !missing && (
        <div role="alert" className="bookcases-error">
          <p className="form-error">
            Couldn't load your books. Check your connection and try again.
          </p>
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {missing && (
        <EmptyState
          icon={Library}
          title="Shelf not found"
          action={
            <Link to="/bookcases" className="button button--secondary">
              Back to bookcases
            </Link>
          }
        >
          This shelf doesn't exist, or it was deleted.
        </EmptyState>
      )}

      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}

      {ready && copies.length === 0 && (
        <EmptyState
          icon={unassignedView ? Inbox : BookOpen}
          title={
            unassignedView ? "Nothing unassigned" : "No books on this shelf"
          }
        >
          {unassignedView
            ? "Every book in your collection is on a shelf."
            : "books you add to this shelf will show up here."}
        </EmptyState>
      )}

      {ready && copies.length > 0 && (
        <>
          <div className="copy-toolbar">
            <Button
              ref={selectButtonRef}
              variant="secondary"
              aria-pressed={selecting}
              onClick={handleToggleSelecting}
            >
              Select multiple
            </Button>
          </div>

          <ul
            ref={listRef}
            tabIndex={-1}
            aria-label="Books"
            className="copy-grid"
          >
            {copies.map((copy) => (
              <CopyCard
                key={copy.id}
                copy={copy}
                selecting={selecting}
                selected={selected.has(copy.id)}
                onToggle={() => toggle(copy.id)}
                onMove={() => askMove([copy.id])}
                onDelete={() => askDelete([copy])}
              />
            ))}
          </ul>

          {selecting && (
            <SelectionBar
              count={selectedCopies.length}
              allSelected={allSelected}
              onToggleAll={handleToggleAll}
              onMove={() => askMove(selectedCopies.map((copy) => copy.id))}
              onDelete={() => askDelete(selectedCopies)}
              onCancel={handleCancelSelecting}
            />
          )}
        </>
      )}

      {pending?.kind === "move" && (
        <MoveCopiesDialog
          key={pending.ids.join(",")}
          count={pending.ids.length}
          bookcases={overview.bookcases}
          currentShelfId={shelfId}
          onMove={handleMove}
          onCancel={() => setPending(null)}
        />
      )}

      <ConfirmDialog
        open={pending?.kind === "delete"}
        title={pending?.title ?? ""}
        confirmLabel={pending?.several ? "Delete books" : "Delete book"}
        busy={busy}
        error={actionError}
        onConfirm={handleDelete}
        onCancel={() => {
          setPending(null);
          setActionError("");
        }}
      >
        {pending?.several
          ? "They will be removed from your collection."
          : "It will be removed from your collection."}
      </ConfirmDialog>
    </section>
  );
}
