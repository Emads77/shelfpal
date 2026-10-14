import { useState } from "react";
import FormField from "../../shared/ui/FormField.jsx";
import "./copy-details.css";

export default function CopyDetailsSection({
  value,
  onChange,
  errors = {},
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const hasErrors = Boolean(errors.edition_number || errors.edition_size);

  function set(name, next) {
    onChange({ ...value, [name]: next });
  }

  return (
    <details
      className="copy-details"
      open={open || hasErrors}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Edition details (optional)</summary>
      <div className="copy-details__body form">
        <label className="copy-details__check">
          <input
            type="checkbox"
            name="is_signed"
            checked={value.isSigned}
            disabled={disabled}
            onChange={(e) => set("isSigned", e.target.checked)}
          />
          Signed
        </label>

        <label className="copy-details__check">
          <input
            type="checkbox"
            name="is_numbered"
            checked={value.isNumbered}
            disabled={disabled}
            onChange={(e) => set("isNumbered", e.target.checked)}
          />
          Numbered
        </label>

        {value.isNumbered && (
          <div className="copy-details__numbers">
            <div className="copy-details__field">
              <FormField
                id="edition_number"
                label="Your number"
                inputMode="numeric"
                maxLength={9}
                value={value.editionNumber}
                readOnly={disabled}
                errors={errors.edition_number}
                onChange={(e) => set("editionNumber", e.target.value)}
              />
            </div>
            <div className="copy-details__field">
              <FormField
                id="edition_size"
                label="Out of"
                inputMode="numeric"
                maxLength={9}
                value={value.editionSize}
                readOnly={disabled}
                errors={errors.edition_size}
                onChange={(e) => set("editionSize", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
