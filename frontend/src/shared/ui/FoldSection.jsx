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

  return (
    <details
      className="fold"
      open={open || hasErrors}
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
