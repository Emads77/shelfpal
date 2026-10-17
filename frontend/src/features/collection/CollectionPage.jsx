import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BookOpen, ScanBarcode, SearchX } from "lucide-react";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { useStatusChange } from "./useStatusChange.js";
import Button from "../../shared/ui/Button.jsx";
import EmptyState from "../../shared/ui/EmptyState.jsx";
import FilterChips from "../../shared/ui/FilterChips.jsx";
import PageHeader from "../../shared/ui/PageHeader.jsx";
import SearchField from "../../shared/ui/SearchField.jsx";
import { getCopies } from "../bookcases/api.js";
import BookCard from "./BookCard.jsx";
import { STATUS_META, STATUS_ORDER, statusOf } from "./statusMeta.js";
import "./collection.css";

function matchesQuery({ book }, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [book.title, book.series, book.author]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(needle));
}

function pluralize(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function ScanBookLink({ children }) {
  return (
    <Link to="/books/scan" className="button button--primary">
      <ScanBarcode size={18} aria-hidden="true" />
      {children}
    </Link>
  );
}

export default function CollectionPage() {
  usePageTitle("Collection");

  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let cancelled = false;
    getCopies()
      .then((data) => {
        if (!cancelled) setCopies(data);
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

  function clearFilters() {
    setQuery("");
    setStatus("all");
  }

  function patchCopy(copyId, changes) {
    setCopies((current) =>
      current.map((copy) =>
        copy.id === copyId ? { ...copy, ...changes } : copy,
      ),
    );
  }

  const { changeStatus, error: statusError } = useStatusChange(patchCopy);

  const visible = useMemo(
    () =>
      copies.filter(
        (copy) =>
          (status === "all" || statusOf(copy) === status) &&
          matchesQuery(copy, query),
      ),
    [copies, query, status],
  );

  const statusOptions = [
    { value: "all", label: "All", count: copies.length },
    ...STATUS_ORDER.map((value) => ({
      value,
      label: STATUS_META[value].label,
      count: copies.filter((copy) => statusOf(copy) === value).length,
    })).filter((option) => option.count > 0 || option.value === status),
  ];

  const bookcaseCount = new Set(
    copies.map((copy) => copy.location?.bookcase_id).filter(Boolean),
  ).size;
  let subtitle;
  if (loading) subtitle = "Loading your books...";
  else if (!loadError && copies.length === 0) subtitle = "Nothing here yet.";
  else if (!loadError) {
    const books = pluralize(copies.length, "book");
    subtitle =
      bookcaseCount === 0
        ? books
        : `${books} in ${pluralize(bookcaseCount, "bookcase")}`;
  }
  const filtering = query.trim() !== "" || status !== "all";

  return (
    <section>
      <PageHeader
        eyebrow="Your library"
        title="My collection"
        subtitle={subtitle}
        actions={<ScanBookLink>Scan book</ScanBookLink>}
      />

      {loading && <p role="status">Loading your collection...</p>}

      {loadError && (
        <div role="alert" className="collection-error">
          <p className="form-error">
            Couldn't load your collection. Check your connection and try again.
          </p>
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {!loading && !loadError && copies.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Start your collection"
          action={<ScanBookLink>Scan your first book</ScanBookLink>}
        >
          Add books by scanning a barcode or searching by title, then place them
          on your shelves.
        </EmptyState>
      )}

      {!loading && !loadError && copies.length > 0 && (
        <>
          <div className="collection-toolbar">
            <SearchField
              label="Search your collection"
              placeholder="Search by title, author, or series"
              value={query}
              onChange={setQuery}
            />
            <FilterChips
              label="Reading status"
              options={statusOptions}
              value={status}
              onChange={setStatus}
            />
          </div>

          <p role="status" className="visually-hidden">
            Showing {visible.length} of {copies.length} books
          </p>

          {statusError && (
            <p role="alert" className="form-error">
              {statusError}
            </p>
          )}

          {visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No books match"
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            >
              Try a different search or reading status.
            </EmptyState>
          ) : (
            <>
              <h2 className="visually-hidden">
                {filtering ? "Matching books" : "All books"}
              </h2>
              <ul className="book-grid">
                {visible.map((copy) => (
                  <BookCard
                    key={copy.id}
                    copy={copy}
                    onStatusChange={changeStatus}
                  />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
