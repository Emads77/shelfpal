import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Check, EllipsisVertical } from "lucide-react";
import IconButton from "./IconButton.jsx";
import "./actions-menu.css";

export default function ActionsMenu({
  label,
  items,
  triggerRef,
  className = "",
  renderTrigger,
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const listRef = useRef(null);
  const rootRef = useRef(null);
  const ownTriggerRef = useRef(null);
  const trigger = triggerRef ?? ownTriggerRef;

  useEffect(() => {
    if (!open) return undefined;

    function closeIfOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
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

  // Open upward when the list would end up under the dock
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!open || !list) return;

    const reserve = parseFloat(getComputedStyle(list).scrollMarginBottom) || 0;
    const listRect = list.getBoundingClientRect();
    const triggerTop = list.parentElement.getBoundingClientRect().top;

    const fitsBelow = listRect.bottom <= window.innerHeight - reserve;
    const fitsAbove = triggerTop - listRect.height >= 0;

    if (!fitsBelow && fitsAbove) {
      list.classList.add("actions-menu__list--up");
    } else {
      list.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  function handleKeyDown(event) {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    }
  }

  function toggle() {
    setOpen((value) => !value);
  }

  function select(item) {
    setOpen(false);
    trigger.current?.focus();
    item.onSelect();
  }

  return (
    <div
      className={`actions-menu ${className}`.trim()}
      ref={rootRef}
      onKeyDown={handleKeyDown}
    >
      {renderTrigger ? (
        // oxlint-disable-next-line react/refs -- ref is only attached to the trigger element, never read during render
        renderTrigger({ ref: trigger, open, toggle, listId, label })
      ) : (
        <IconButton
          ref={trigger}
          label={label}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={toggle}
        >
          <EllipsisVertical size={20} aria-hidden="true" />
        </IconButton>
      )}

      {open && (
        <ul ref={listRef} id={listId} className="actions-menu__list">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`actions-menu__item ${item.danger ? "actions-menu__item--danger" : ""}`.trim()}
                  aria-current={item.selected ? "true" : undefined}
                  onClick={() => select(item)}
                >
                  {Icon && <Icon size={18} aria-hidden="true" />}
                  {item.label}
                  {item.selected && (
                    <Check
                      size={16}
                      className="actions-menu__check"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
