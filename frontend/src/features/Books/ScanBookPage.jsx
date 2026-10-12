import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router";
import Button from "../../shared/ui/Button.jsx";
import { errorMessage } from "../bookcases/errorMessage.js";
import { addCopyFromBook, lookupBook } from "./api.js";
import "./books.css";
import { getLibraryOverview } from "../bookcases/api.js";
import BarcodeScanner from "./BarcodeScanner.jsx";

function cleanIsbn(raw) {
  return raw.replace(/[\s-]/g, "");
}

function isValidIsbn(value) {
  return /^(\d{9}[\dXx]|97[89]\d{10})$/.test(value);
}

export default function ScanBookPage() {
  const navigate = useNavigate();
  const id = useId();
  const [isbn, setIsbn] = useState("");
  const [book, setBook] = useState(null);
  const [looking, setLooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [bookcases, setBookcases] = useState([]);
  const [shelf, setShelf] = useState("");
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

  async function runLookup(cleaned) {
    setError("");
    setNotFound(false);
    setBook(null);
    setLooking(true);
    try {
      setBook(await lookupBook(cleaned));
    } catch (err) {
      if (err.status === 404) {
        setNotFound(true);
      } else if (err.status === 503) {
        setError("Open Library is not reachable right now. Try again soon.");
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

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      const shelfId = shelf === "" ? null : Number(shelf);
      const copy = await addCopyFromBook(book.id, shelfId);
      navigate(pathFor(copy.shelf));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <div className="add-book">
      <h1>Add a book by ISBN</h1>

      <form className="scan-book__form" noValidate onSubmit={handleLookup}>
        <div className="add-book__field">
          <label htmlFor={`${id}-isbn`}>ISBN</label>
          <input
            id={`${id}-isbn`}
            type="text"
            inputMode="numeric"
            maxLength={17}
            value={isbn}
            readOnly={looking || saving}
            onChange={(e) => setIsbn(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={looking || saving}>
          {looking ? "Looking up..." : "Look up"}
        </Button>
      </form>
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

      {error && (
        <p role="alert" className="add-book__error">
          {error}
        </p>
      )}

      {notFound && (
        <p role="alert" className="add-book__error">
          Open Library does not know this ISBN.{" "}
          <Link to="/books/new">Enter the book by hand</Link>
        </p>
      )}

      {book && (
        <section className="scan-book__preview">
          {book.cover && (
            <img
              src={book.cover}
              className="scan-book__cover"
              alt={`Cover of ${book.title}`}
            />
          )}
          <h2 className="scan-book__title">{book.title}</h2>
          <p className="scan-book__meta">{book.author}</p>
          {book.publisher && (
            <p className="scan-book__meta">{book.publisher}</p>
          )}
          <div className="add-book__field">
            <label htmlFor={`${id}-shelf`}>Shelf</label>
            <select
              id={`${id}-shelf`}
              value={shelf}
              disabled={saving}
              onChange={(e) => setShelf(e.target.value)}
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
          </div>
          <Button type="button" disabled={saving} onClick={handleConfirm}>
            {saving ? "Adding..." : "Add to my collection"}
          </Button>
        </section>
      )}

      <p className="scan-book__alt">
        <Link to="/books/new">Enter a book by hand instead</Link>
      </p>
    </div>
  );
}
