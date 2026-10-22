import { useState } from "react";
import "./fold-section.css";

export default function FoldSection({
  title,
  hint,
  defaultOpen = true,
  hasErrors = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [hadErrors, setHadErrors] = useState(hasErrors);

  if (hasErrors !== hadErrors) {
    setHadErrors(hasErrors);
    if (hasErrors) setOpen(true);
  }

  return (
    <details
      className="fold"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="fold__summary">
        <span className="fold__title">{title}</span>
        {hint && <span className="fold__hint">{hint}</span>}
      </summary>
      <div className="fold__body form">{children}</div>
    </details>
  );
}
