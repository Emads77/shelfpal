import { useEffect, useId, useRef, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import IconButton from "./IconButton.jsx";
import "./actions-menu.css";

// items: [{key, label, icon, onSelect, danger }]
export default function ActionsMenu({ label, items, triggerRef }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef(null);
  const ownTriggerRef = useRef(null);
  const trigger = triggerRef ?? ownTriggerRef;

  useEffect(() => {
    if (!open) return undefined;

    function closeIfOutside(event) {
      if (rootRef.current && !rootRef.current.constains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("focusin", closeIfOutside);
    return () => {
      document.removeEventListener("pointerdown", closeIfOutside);
      document.removeEventListener("focusin", closeIfOutside);
    };
  }, [open]);

  function handleKeyDown(event) {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    }
  }

  function select(item) {
    setOpen(false);
    trigger.current?.focus();
    item.onSelect();
  }

  return (
    <div className="actions-menu" ref={rootRef} onKeyDown={handleKeyDown}>
      <IconButton
        ref={trigger}
        label={label}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((value) => !value)}
        >
        <EllipsisVertical size={20} aria-hidden="true" />
      </IconButton>

      {open && (
        <ul id={listId} className="actions-menu__list">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`actions-menu__item ${item.danger ? "actions-menu__item--danger" : ""}`.trim()}
                  onClick={() => select(item)}
                  >
                  {Icon && <Icon size={18} aria-hidden="true" />}
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
