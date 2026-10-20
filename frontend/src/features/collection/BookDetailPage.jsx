import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { ArrowLeft, Hash, PenLine } from "lucide-react";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import Badge from "../../shared/ui/Badge.jsx";
import Button from "../../shared/ui/Button.jsx";
import { getCopy } from "../bookcases/api.js";
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
  const [copy, setCopy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  usePageTitle(copy?.book.title ?? "Book");

  useEffect(() => {
    let cancelled = false;
    getCopy(copyId)
      .then((data) => {
        if (!cancelled) setCopy(data);
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
  }, [copyId, attempt]);

  function retry() {
    setLoadError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
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

  return (
    <article className="book-detail">
      <BackLink />

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
