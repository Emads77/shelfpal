import { ArrowRightLeft, Trash2 } from "lucide-react";
import Button from "../../shared/ui/Button.jsx";
import "./copies.css";

export default function SelectionBar({
  count,
  allSelected,
  onToggleAll,
  onMove,
  onDelete,
  onCancel,
}) {
  return (
    <section className="selection-bar" aria-label="Selection actions">
      <div className="selection-bar__summary">
        <p role="status" className="selection-bar__count">
          {count} selected
        </p>
        <Button
          variant="secondary"
          className="selection-bar__toggle"
          onClick={onToggleAll}
        >
          {allSelected ? "Deselect all" : "Select all"}
        </Button>
      </div>
      <div className="selection-bar__actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          className="selection-bar__delete"
          onClick={onDelete}
          disabled={count === 0}
        >
          <Trash2 size={18} aria-hidden="true" />
          Delete
        </Button>
        <Button onClick={onMove} disabled={count === 0}>
          <ArrowRightLeft size={18} aria-hidden="true" />
          Move
        </Button>
      </div>
    </section>
  );
}
