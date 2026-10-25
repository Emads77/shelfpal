import FoldSection from "../../shared/ui/FoldSection.jsx";
import FormField from "../../shared/ui/FormField.jsx";
import { BOOK_FIELD_NAMES } from "./bookFields.js";

export default function BookFieldSection({
  value,
  onChange,
  errors,
  disabled,
  hint,
  open,
}) {
  const hasErrors = BOOK_FIELD_NAMES.some((name) => errors[name]);

  return (
    <FoldSection
      title="About the book"
      hint={hint}
      open={open}
      hasErrors={hasErrors}
    >
      <FormField
        id="title"
        label="Title"
        maxLength={200}
        value={value.title}
        readOnly={disabled}
        errors={errors.title}
        onChange={(e) => onChange("title", e.target.value)}
      />
      <FormField
        id="author"
        label="Author"
        maxLength={200}
        value={value.author}
        readOnly={disabled}
        errors={errors.author}
        onChange={(e) => onChange("author", e.target.value)}
      />
      <FormField
        id="isbn"
        label="ISBN (optional)"
        maxLength={17}
        value={value.isbn}
        readOnly={disabled}
        errors={errors.isbn}
        onChange={(e) => onChange("isbn", e.target.value)}
      />
      <FormField
        id="publisher"
        label="Publisher (optional)"
        maxLength={200}
        value={value.publisher}
        readOnly={disabled}
        errors={errors.publisher}
        onChange={(e) => onChange("publisher", e.target.value)}
      />
      <FormField
        id="cover"
        label="Cover URL (optional)"
        type="url"
        value={value.cover}
        readOnly={disabled}
        errors={errors.cover}
        onChange={(e) => onChange("cover", e.target.value)}
      />
    </FoldSection>
  );
}
