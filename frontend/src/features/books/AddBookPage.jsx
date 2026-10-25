import { useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router";
import Button from "../../shared/ui/Button.jsx";
import FoldSection from "../../shared/ui/FoldSection.jsx";
import FormError from "../../shared/ui/FormError.jsx";
import ShelfPicker from "../bookcases/ShelfPicker.jsx";
import { rememberShelf, useShelfPicker } from "../bookcases/useShelfPicker.js";
import { addBookManually } from "./api.js";
import BookFieldsSection from "./BookFieldsSection.jsx";
import {
  BOOK_FIELD_NAMES,
  bookPayload,
  EMPTY_BOOK,
  validateBook,
} from "./bookFields.js";
import CopyDetailsSection from "./CopyDetailsSection.jsx";
import {
  detailsPayload,
  EMPTY_DETAILS,
  validateDetails,
} from "./copyDetails.js";
import { splitServerErrors } from "./serverErrors.js";
import "./books.css";

//Order in which the first invalid field receives focus
const FIELD_ORDER = [
  ...BOOK_FIELD_NAMES,
  "shelf",
  "edition_number",
  "edition_size",
];

export default function AddBookPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_BOOK);
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const picker = useShelfPicker();

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
      const copy = await addBookManually({
        ...bookPayload(form),
        shelf: picker.shelf === "" ? null : Number(picker.shelf),
        ...detailsPayload(details),
      });
      rememberShelf(copy.shelf);
      navigate(picker.pathFor(copy.shelf));
    } catch (err) {
      const { fields, rest } = splitServerErrors(err, FIELD_ORDER);
      showErrors(fields, formElement, rest);
    }
  }

  const copyHasErrors = ["shelf", "edition_number", "edition_size"].some(
    (k) => errors[k],
  );

  return (
    <form className="add-book" noValidate onSubmit={handleSubmit}>
      <h1>Add a book</h1>

      <BookFieldsSection
        value={form}
        onChange={update}
        errors={errors}
        disabled={saving}
      />

      <FoldSection
        title="Your copy"
        hint="Only you can see this"
        hasErrors={copyHasErrors}
      >
        <ShelfPicker
          picker={picker}
          disabled={saving}
          errors={errors.shelf}
          onChange={() => clearError("shelf")}
        />

        <CopyDetailsSection
          value={details}
          onChange={updateDetails}
          errors={errors}
          disabled={saving}
        />
      </FoldSection>

      <FormError>{formError || picker.loadError}</FormError>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Add book"}
      </Button>
    </form>
  );
}
