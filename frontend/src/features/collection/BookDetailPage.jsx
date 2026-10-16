import { useRef, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import {
  ArrowLeft,
  ArrowRightLeft,
  Hash,
  PenLine,
  Pencil,
  Trash2,
} from "lucide-react";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import ActionsMenu from "../../shared/ui/ActionsMenu.jsx";
import Badge from "../../shared/ui/Badge.jsx";
import Button from "../../shared/ui/Button.jsx";
import ConfirmDialog from "../../shared/ui/ConfirmDialog.jsx";
import {
  deleteCopies,
  getLibraryOverview,
  moveCopies,
} from "../bookcases/api.js";
import { errorMessage } from "../bookcases/errorMessage.js";
import MoveCopiesDialog from "../bookcases/MoveCopiesDialog.jsx";
import { useCopy } from "../bookcases/useCopy.js";
import BookCover from "./BookCover.jsx";
import { placeOf } from "./placeOf.js";
import { STATUS_META, statusOf } from "./statusMeta.js";
import "./book-detail.css";

function BackLink() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.key !== "default") {
    return (
      <button
        type="button"
        className="book-detail__back"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Back
      </button>
    );
  }
  return (
    <Link to="/" className="book-detail__back">
      <ArrowLeft size={18} aria-hidden="true" />
      Collection
    </Link>
  );
}

function Fact({ label, children }) {
  if (!children) return null;
  return (
    <div className="book-detail__fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function BookDetail({ copyId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { copy, loading, loadError, retry, reload } = useCopy(copyId);
  const [moveTargets, setMoveTargets] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const menuRef = useRef(null);

  usePageTitle(copy?.book.title ?? "Book");

  function leave() {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  }

  async function askMove() {
    setMenuError("");
    try {
      const overview = await getLibraryOverview();
      setMoveTargets(overview.bookcases);
    } catch (err) {
      setMenuError(errorMessage(err));
    }
  }

  function closeMove() {
    setMoveTargets(null);
    menuRef.current?.focus();
  }

  async function handleMove(targetShelfId) {
    await moveCopies([copy.id], targetShelfId);
    await reload();
    closeMove();
  }

  function askDelete() {
    setDeleteError("");
    setDeleting(true);
  }

  function closeDelete() {
    setDeleting(false);
    setDeleteError("");
    menuRef.current?.focus();
  }

  async function handleDelete() {
    setBusy(true);
    setDeleteError("");
    try {
      await deleteCopies([copy.id]);
      leave();
    } catch (err) {
      setDeleteError(errorMessage(err));
      setBusy(false);
    }
  }

  if (loading) return <p role="status">Loading book...</p>;

  if (loadError) {
    const notFound = loadError.status === 404;
    return (
      <div role="alert" className="collection-error">
        <p className="form-error">
          {notFound
            ? "We couldn't find this book."
            : "Couldn't load this book. Check your connection and try again."}
        </p>
        {notFound ? (
          <Link to="/">Back to your collection</Link>
        ) : (
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  const { book } = copy;
  const meta = STATUS_META[statusOf(copy)];
  const place = placeOf(copy.location);
  const placeLabel = place.bookcase
    ? `${place.bookcase} · ${place.shelf}`
    : place.shelf;
  const numbered = copy.edition_number !== null;
  const numberLabel = copy.edition_size
    ? `Numbered ${copy.edition_number} / ${copy.edition_size}`
    : `Numbered ${copy.edition_number}`;

  const menuItems = [
    {
      key: "edit",
      label: "Edit",
      icon: Pencil,
      onSelect: () => navigate(`/books/${copy.id}/edit`),
    },
    {
      key: "move",
      label: "Move to...",
      icon: ArrowRightLeft,
      onSelect: askMove,
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      danger: true,
      onSelect: askDelete,
    },
  ];

  return (
    <article className="book-detail">
      <div className="book-detail__topbar">
        <BackLink />
        <ActionsMenu
          label={`Actions for ${book.title}`}
          items={menuItems}
          triggerRef={menuRef}
        />
      </div>

      {menuError && (
        <p role="alert" className="form-error">
          {menuError}
        </p>
      )}

      <div className="book-detail__layout">
        <div className="book-detail__cover">
          <BookCover title={book.title} coverUrl={book.cover} />
        </div>

        <div className="book-detail__main">
          <div>
            <h1 className="book-detail__title">{book.title}</h1>
            <p className="book-detail__author">{book.author}</p>
          </div>

          <div className="book-detail__tags">
            <Badge variant={meta.variant} icon={meta.icon}>
              {meta.label}
            </Badge>
            {copy.is_signed && (
              <Badge variant="soft" icon={PenLine}>
                Signed
              </Badge>
            )}
            {numbered && (
              <Badge variant="soft" icon={Hash}>
                {numberLabel}
              </Badge>
            )}
          </div>

          <dl className="book-detail__facts">
            <Fact label="Location">
              <Link to={place.to}>{placeLabel}</Link>
            </Fact>
            <Fact label="ISBN">{book.isbn}</Fact>
            <Fact label="Publisher">{book.publisher}</Fact>
          </dl>
        </div>
      </div>

      {moveTargets && (
        <MoveCopiesDialog
          count={1}
          bookcases={moveTargets}
          currentShelfId={copy.shelf}
          onMove={handleMove}
          onCancel={closeMove}
        />
      )}

      <ConfirmDialog
        open={deleting}
        title={`Delete “${book.title}”?`}
        confirmLabel="Delete book"
        busy={busy}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={closeDelete}
      >
        It will be removed from your collection.
      </ConfirmDialog>
    </article>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const copyId = Number(params.copyId);

  if (!Number.isInteger(copyId)) {
    return <Navigate to="/" replace />;
  }

  return <BookDetail key={copyId} copyId={copyId} />;
}
