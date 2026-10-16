import { useState } from "react";
import { flushSync } from "react-dom";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import Button from "../../shared/ui/Button.jsx";
import FoldSection from "../../shared/ui/FoldSection.jsx";
import FormError from "../../shared/ui/FormError.jsx";
import { updateCopy } from "../bookcases/api.js";
import { useCopy } from "../bookcases/useCopy.js";
import BookFieldsSection from "./BookFieldsSection.jsx";
import {
  BOOK_FIELD_NAMES,
  bookFromCopy,
  bookPayload,
  validateBook,
} from "./bookFields.js";
import CopyDetailsSection from "./CopyDetailsSection.jsx";
import {
  detailsFromCopy,
  detailsPayload,
  validateDetails,
} from "./copyDetails.js";
import { splitServerErrors } from "./serverErrors.js";
import "./books.css";

const FIELD_ORDER = [...BOOK_FIELD_NAMES, "edition_number", "edition_size"];

function EditBookForm({ copy }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(() => bookFromCopy(copy.book));
  const [details, setDetails] = useState(() => detailsFromCopy(copy));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const detailPath = `/books/${copy.id}`;

  function leave() {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(detailPath, { replace: true });
    }
  }

  function clearError(name) {
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    clearError(name);
    setFormError("");
  }

  function updateDetails(next) {
    setDetails(next);
    clearError("edition_number");
    clearError("edition_size");
    setFormError("");
  }

  function showErrors(nextErrors, formElement, message = "") {
    flushSync(() => {
      setSaving(false);
      setErrors(nextErrors);
      setFormError(message);
    });
    const first = FIELD_ORDER.find((name) => nextErrors[name]?.length);
    if (first) formElement.elements.namedItem(first)?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;

    const found = { ...validateBook(form), ...validateDetails(details) };
    if (Object.keys(found).length > 0) {
      showErrors(found, formElement);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await updateCopy(copy.id, {
        ...bookPayload(form),
        ...detailsPayload(details),
      });
      leave();
    } catch (err) {
      const { fields, rest } = splitServerErrors(err, FIELD_ORDER);
      showErrors(fields, formElement, rest);
    }
  }

  const copyHasErrors = ["edition_number", "edition_size"].some(
    (k) => errors[k],
  );

  return (
    <form className="add-book" noValidate onSubmit={handleSubmit}>
      <h1>Edit Book</h1>

      <BookFieldsSection
        value={form}
        onChange={update}
        errors={errors}
        disabled={saving}
        hint="Changes only apply to your copy"
      />

      <FoldSection
        title="Your copy"
        hint="Only you can see this"
        hasErrors={copyHasErrors}
      >
        <CopyDetailsSection
          value={details}
          onChange={updateDetails}
          errors={errors}
          disabled={saving}
        />
      </FoldSection>

      <FormError>{formError}</FormError>

      <div className="edit-book__actions">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="secondary" disabled={saving} onClick={leave}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditBook({ copyId }) {
  const { copy, loading, loadError, retry } = useCopy(copyId);

  usePageTitle(copy ? `Edit ${copy.book.title}` : "Edit book");

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

  return <EditBookForm copy={copy} />;
}

export default function EditBookPage() {
  const params = useParams();
  const copyId = Number(params.copyId);

  if (!Number.isInteger(copyId)) {
    return <Navigate to="/" replace />;
  }

  return <EditBook key={copyId} copyId={copyId} />;
}
