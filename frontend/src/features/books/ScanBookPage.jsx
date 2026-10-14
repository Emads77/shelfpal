import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router";
import Button from "../../shared/ui/Button.jsx";
import FoldSection from "../../shared/ui/FoldSection.jsx";
import FormError from "../../shared/ui/FormError.jsx";
import FormField from "../../shared/ui/FormField.jsx";
import { getLibraryOverview } from "../bookcases/api.js";
import { errorMessage } from "../bookcases/errorMessage.js";
import { addCopyFromBook, lookupBook } from "./api.js";
import BarcodeScanner from "./BarcodeScanner.jsx";
import CopyDetailsSection from "./CopyDetailsSection.jsx";
import {
  detailsPayload,
  EMPTY_DETAILS,
  validateDetails,
} from "./copyDetails.js";
import { splitServerErrors } from "./serverErrors.js";
import "./books.css";

// Order in which the first invalid field receives focus
const FIELD_ORDER = ["shelf", "edition_number", "edition_size"];

function cleanIsbn(raw) {
  return raw.replace(/[\s-]/g, "");
}

function isValidIsbn(value) {
  return /^(\d{9}[\dXx]|97[89]\d{10})$/.test(value);
}

function preloadImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve();
      return;
    }
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = url;
    setTimeout(resolve, 4000);
  });
}

export default function ScanBookPage() {
  const navigate = useNavigate();
  const [isbn, setIsbn] = useState("");
  const [book, setBook] = useState(null);
  const [looking, setLooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [errors, setErrors] = useState({});
  const [bookcases, setBookcases] = useState([]);
  const [shelf, setShelf] = useState("");
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    getLibraryOverview()
      .then((overview) => setBookcases(overview.bookcases))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  function pathFor(shelfId) {
    if (shelfId === null) return "/bookcases/unassigned";
    const bookcase = bookcases.find((b) =>
      b.shelves.some((s) => s.id === shelfId),
    );
    return bookcase
      ? `/bookcases/${bookcase.id}/shelves/${shelfId}`
      : "/bookcases";
  }

  function clearError(name) {
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function updateShelf(value) {
    setShelf(value);
    clearError("shelf");
    setSaveError("");
  }

  function updateDetails(next) {
    setDetails(next);
    clearError("edition_number");
    clearError("edition_size");
    setSaveError("");
  }

  async function runLookup(cleaned) {
    setError("");
    setSaveError("");
    setErrors({});
    setNotFound(false);
    setBook(null);
    setDetails(EMPTY_DETAILS);
    setLooking(true);
    try {
      const found = await lookupBook(cleaned);
      await preloadImage(found.cover);
      setBook(found);
    } catch (err) {
      if (err.status === 404) {
        setNotFound(true);
      } else if (err.status === 503) {
        setError(
          "We couldn't look up this book right now. Try again in a moment, or enter it by hand below.",
        );
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setLooking(false);
    }
  }

  function handleLookup(event) {
    event.preventDefault();
    setError("");
    setNotFound(false);
    setBook(null);

    const cleaned = cleanIsbn(isbn);
    if (!isValidIsbn(cleaned)) {
      setError("That is not a book barcode. An ISBN has 10 or 13 digits.");
      return;
    }
    runLookup(cleaned);
  }

  function handleDetected(code) {
    setScanning(false);
    setIsbn(code);
    if (!/^97[89]\d{10}$/.test(code)) {
      setBook(null);
      setNotFound(false);
      setError(
        "That is not a book barcode. Book barcodes start with 978 or 979.",
      );
      return;
    }
    runLookup(code);
  }

  function handleCameraError() {
    setScanning(false);
    setError("The camera is not available. Type the ISBN instead.");
  }

  function showErrors(nextErrors, formElement, message = "") {
    flushSync(() => {
      setSaving(false);
      setErrors(nextErrors);
      setSaveError(message);
    });
    const first = FIELD_ORDER.find((name) => nextErrors[name]?.length);
    if (first) formElement.elements.namedItem(first)?.focus();
  }

  async function handleConfirm(event) {
    event.preventDefault();
    const formElement = event.currentTarget;

    const found = validateDetails(details);
    if ((Object.keys(found), length > 0)) {
      showErrors(found, formElement);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const shelfId = shelf === "" ? null : Number(shelf);
      const copy = await addCopyFromBook(
        book.id,
        shelfId,
        detailsPayload(details),
      );
      navigate(pathFor(copy.shelf));
    } catch (err) {
      const { fields, rest } = splitServerErrors(err, FIELD_ORDER);
      showErrors(fields, formElement, rest);
    }
  }

  const copyHasErrors = FIELD_ORDER.some((k) => errors[k]);

  return (
    <div className="add-book">
      <h1>Scan a book</h1>

      {/* Forced open while the camera runs because the scanner needs a visible box */}
      <FoldSection title="Find your book" hasErrors={scanning}>
        <Button
          type="button"
          disabled={looking || saving}
          onClick={() => setScanning((current) => !current)}
        >
          {scanning ? "Stop scanning" : "Scan barcode"}
        </Button>

        {scanning && (
          <BarcodeScanner
            onDetected={handleDetected}
            onError={handleCameraError}
          />
        )}

        <form className="form" noValidate onSubmit={handleLookup}>
          <FormField
            id="isbn"
            label="Or type the ISBN"
            inputMode="numeric"
            maxLength={17}
            value={isbn}
            readOnly={looking || saving}
            onChange={(e) => setIsbn(e.target.value)}
          />
          <Button type="submit" disabled={looking || saving}>
            {looking ? "Looking up..." : "Look up"}
          </Button>
        </form>
      </FoldSection>

      {error && (
        <p role="alert" className="add-book__error">
          {error}
        </p>
      )}

      {notFound && (
        <p role="alert" className="add-book__error">
          We couldn't find a book with this ISBN.{" "}
          <Link to="/books/new">Enter the book by hand</Link>
        </p>
      )}

      {looking && (
        <div className="scan-result scan-result--loading" role="status">
          <div className="scan-result__placeholder-cover" aria-hidden="true" />
          <div className="scan-result__info">
            <p className="scan-result__label">Searching for your book...</p>
            <span className="scan-result__line" aria-hidden="true" />
            <span
              className="scan-result__line scan-result__line--short"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {book && (
        <form className="scan-book__result" noValidate onSubmit={handleConfirm}>
          <section className="scan-result" aria-label="Book found">
            {book.cover && (
              <img
                src={book.cover}
                className="scan-result__cover"
                alt={`Cover of ${book.title}`}
              />
            )}
            <div className="scan-result__info">
              <p className="scan-result__label">Book found</p>
              <h2 className="scan-book__title">{book.title}</h2>
              <p className="scan-book__meta">{book.author}</p>
              {book.publisher && (
                <p className="scan-book__meta">{book.publisher}</p>
              )}
            </div>
          </section>

          <FoldSection
            title="Your copy"
            hint="Only you can see this"
            hasErrors={copyHasErrors}
          >
            <div className="add-book__field">
              <label htmlFor="shelf">Shelf</label>
              <select
                id="shelf"
                name="shelf"
                value={shelf}
                disabled={saving}
                aria-invalid={Boolean(errors.shelf?.length)}
                aria-describedby={
                  errors.shelf?.length ? "shelf-error" : undefined
                }
                onChange={(e) => updateShelf(e.target.value)}
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
              {errors.shelf?.length > 0 && (
                <p id="shelf-error" className="field-error">
                  {errors.shelf.join(" ")}
                </p>
              )}
            </div>

            <CopyDetailsSection
              value={details}
              onChange={updateDetails}
              errors={errors}
              disabled={saving}
            />
          </FoldSection>

          <FormError>{saveError}</FormError>

          <Button type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add to my collection"}
          </Button>
        </form>
      )}

      <p className="scan-book__alt">
        <Link to="/books/new">Enter a book by hand instead</Link>
      </p>
    </div>
  );
}
