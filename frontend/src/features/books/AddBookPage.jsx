import { useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router";
import Button from "../../shared/ui/Button.jsx";
import FoldSection from "../../shared/ui/FoldSection.jsx";
import FormError from "../../shared/ui/FormError.jsx";
import FormField from "../../shared/ui/FormField.jsx";
import { rememberShelf, useShelfPicker } from "../bookcases/useShelfPicker.js";
import { addBookManually } from "./api.js";
import CopyDetailsSection from "./CopyDetailsSection.jsx";
import {
  detailsPayload,
  EMPTY_DETAILS,
  validateDetails,
} from "./copyDetails.js";
import { splitServerErrors } from "./serverErrors.js";
import "./books.css";
import ShelfPicker from "../bookcases/ShelfPicker.jsx";

const EMPTY_FORM = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  cover: "",
};

//Order in which the first invalid field receives focus
const FIELD_ORDER = [
  "title",
  "author",
  "isbn",
  "publisher",
  "cover",
  "shelf",
  "edition_number",
  "edition_size",
];

function validate(form, details) {
  const errors = {};
  if (!form.title.trim()) errors.title = ["Title is required."];
  if (!form.author.trim()) errors.author = ["Author is required."];
  return { ...errors, ...validateDetails(details) };
}

export default function AddBookPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
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

    const found = validate(form, details);
    if (Object.keys(found).length > 0) {
      showErrors(found, formElement);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const copy = await addBookManually({
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim(),
        publisher: form.publisher.trim(),
        cover: form.cover.trim(),
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

  const aboutHasErrors = ["title", "author", "isbn", "publisher", "cover"].some(
    (k) => errors[k],
  );
  const copyHasErrors = ["shelf", "edition_number", "edition_size"].some(
    (k) => errors[k],
  );

  return (
    <form className="add-book" noValidate onSubmit={handleSubmit}>
      <h1>Add a book</h1>

      <FoldSection title="About the book" hasErrors={aboutHasErrors}>
        <FormField
          id="title"
          label="Title"
          maxLength={200}
          value={form.title}
          readOnly={saving}
          errors={errors.title}
          onChange={(e) => update("title", e.target.value)}
        />
        <FormField
          id="author"
          label="Author"
          maxLength={200}
          value={form.author}
          readOnly={saving}
          errors={errors.author}
          onChange={(e) => update("author", e.target.value)}
        />
        <FormField
          id="isbn"
          label="ISBN (optional)"
          maxLength={17}
          value={form.isbn}
          readOnly={saving}
          errors={errors.isbn}
          onChange={(e) => update("isbn", e.target.value)}
        />
        <FormField
          id="publisher"
          label="Publisher (optional)"
          maxLength={200}
          value={form.publisher}
          readOnly={saving}
          errors={errors.publisher}
          onChange={(e) => update("publisher", e.target.value)}
        />
        <FormField
          id="cover"
          label="Cover URL (optional)"
          type="url"
          value={form.cover}
          readOnly={saving}
          errors={errors.cover}
          onChange={(e) => update("cover", e.target.value)}
        />
      </FoldSection>

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
