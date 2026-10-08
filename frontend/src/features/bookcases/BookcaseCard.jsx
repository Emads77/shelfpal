import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import ActionsMenu from "../../shared/ui/ActionsMenu.jsx";
import ConfirmDialog from "../../shared/ui/ConfirmDialog.jsx";
import BulkShelvesForm from "./BulkShelvesForm.jsx";
import NameForm from "./NameForm.jsx";
import ShelfRow from "./ShelfRow.jsx";
import { errorMessage } from "./errorMessage.js";
import { pluralize } from "./pluralize.js";
import "./bookcases.css";

function booksNote(count) {
  if (count === 0) return "It has no books.";
  if (count === 1) {
    return "Its 1 book stays in your collection and becomes unassigned.";
  }
  return `Its ${count} books stay in your collection and become unassigned.`;
}

function deleteTexts(confirm, bookcase) {
  if (!confirm) return { title: "", body: "", button: "" };

  if (confirm.kind === "bookcase") {
    const shelves =
      bookcase.shelf_count === 0
        ? "It has no shelves."
        : `Its ${pluralize(bookcase.shelf_count, "shelf", "shelves")} will be deleted too.`;
    return {
      title: `Delete bookcase “${bookcase.name}”?`,
      body: `${shelves} ${booksNote(bookcase.book_count)}`,
      button: "Delete bookcase",
    };
  }

  return {
    title: `Delete shelf “${confirm.shelf.name}”?`,
    body: booksNote(confirm.shelf.book_count),
    button: "Delete shelf",
  };
}

export default function BookcaseCard({
  bookcase,
  open,
  onToggle,
  onRename,
  onDelete,
  onAddShelves,
  onRenameShelf,
  onDeleteShelf,
  autoFocusAddShelf,
  onAutoFocused,
}) {
  const panelId = useId();
  const toggleRef = useRef(null);
  const addTileRef = useRef(null);
  const wasRenaming = useRef(false);
  const previousAddMode = useRef("closed");

  const [renaming, setRenaming] = useState(false);
  const [addMode, setAddMode] = useState(
    autoFocusAddShelf ? "single" : "closed",
  ); // "closed" | "single" | "bulk"
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { name, shelf_count, book_count, shelves } = bookcase;
  const texts = deleteTexts(confirm, bookcase);

  useEffect(() => {
    if (wasRenaming.current && !renaming) toggleRef.current?.focus();
    wasRenaming.current = renaming;
  }, [renaming]);

  useEffect(() => {
    if (previousAddMode.current !== "closed" && addMode === "closed") {
      addTileRef.current?.focus();
    }
    previousAddMode.current = addMode;
  }, [addMode]);

  useEffect(() => {
    if (autoFocusAddShelf) onAutoFocused();
  }, [autoFocusAddShelf, onAutoFocused]);

  function askToDelete(target) {
    setDeleteError("");
    setConfirm(target);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      if (confirm.kind === "bookcase") {
        await onDelete();
      } else {
        await onDeleteShelf(confirm.shelf.id);
        setConfirm(null);
        setTimeout(() => toggleRef.current?.focus(), 0);
      }
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="bookcase-card">
      <div className="bookcase-card__header">
        <h2 className="bookcase-card__heading">
          <button
            ref={toggleRef}
            type="button"
            className="bookcase-card__toggle"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={onToggle}
          >
            <span className="bookcase-card__text">
              <span className="bookcase-card__name">{name}</span>
              <span className="bookcase-card__meta">
                {pluralize(shelf_count, "shelf", "shelves")} ·{" "}
                {pluralize(book_count, "book")}
              </span>
            </span>
            <ChevronDown
              className="bookcase-card__chevron"
              size={22}
              aria-hidden="true"
            />
          </button>
        </h2>
        <div className="bookcase-card__menu">
          <ActionsMenu
            label={`Actions for bookcase ${name}`}
            items={[
              {
                key: "rename",
                label: "Rename",
                icon: Pencil,
                onSelect: () => setRenaming(true),
              },
              {
                key: "delete",
                label: "Delete",
                icon: Trash2,
                danger: true,
                onSelect: () => askToDelete({ kind: "bookcase" }),
              },
            ]}
          />
        </div>
      </div>

      {renaming && (
        <div className="bookcase-card__rename">
          <NameForm
            label={`New name for bookcase ${name}`}
            initialValue={name}
            submitLabel="Save"
            autoFocus
            onSubmit={async (newName) => {
              await onRename(newName);
              setRenaming(false);
            }}
            onCancel={() => setRenaming(false)}
          />
        </div>
      )}

      <div id={panelId} className="bookcase-card__panel" hidden={!open}>
        {shelves.length === 0 ? (
          <p className="bookcase-card__empty">
            This bookcase has no shelves yet.
          </p>
        ) : (
          <ul className="shelf-list">
            {shelves.map((shelf) => (
              <ShelfRow
                key={shelf.id}
                shelf={shelf}
                to={`/bookcases/${bookcase.id}/shelves/${shelf.id}`}
                onRename={(newName) => onRenameShelf(shelf.id, newName)}
                onRequestDelete={() => askToDelete({ kind: "shelf", shelf })}
              />
            ))}
          </ul>
        )}

        <div className="bookcase-card__add">
          {addMode === "closed" && (
            <button
              ref={addTileRef}
              type="button"
              className="add-tile"
              aria-label={`Add a shelf to ${name}`}
              title="Add a shelf"
              onClick={() => setAddMode("single")}
            >
              <Plus size={22} aria-hidden="true" />
            </button>
          )}

          {addMode === "single" && (
            <>
              <NameForm
                label={`Add a shelf to ${name}`}
                placeholder="Shelf name"
                submitLabel="Add shelf"
                cancelLabel="Done"
                autoFocus
                stayOpen
                onSubmit={(shelfName) => onAddShelves([shelfName])}
                onCancel={() => setAddMode("closed")}
              />
              <button
                type="button"
                className="link-button"
                onClick={() => setAddMode("bulk")}
              >
                Add several shelves
              </button>
            </>
          )}

          {addMode === "bulk" && (
            <BulkShelvesForm
              bookcaseName={name}
              existingNames={shelves.map((shelf) => shelf.name)}
              onSubmit={async (names) => {
                await onAddShelves(names);
                setAddMode("closed");
              }}
              onCancel={() => setAddMode("closed")}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={texts.title}
        confirmLabel={texts.button}
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      >
        {texts.body}
      </ConfirmDialog>
    </li>
  );
}
