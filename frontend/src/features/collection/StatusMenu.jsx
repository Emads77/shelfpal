import { ChevronDown } from "lucide-react";
import ActionsMenu from "../../shared/ui/ActionsMenu.jsx";
import { STATUS_META, STATUS_ORDER } from "./statusMeta.js";
import "./status-menu.css";

export default function StatusMenu({ status, title, onChange }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  const items = STATUS_ORDER.map((key) => ({
    key,
    label: STATUS_META[key].label,
    icon: STATUS_META[key].icon,
    selected: key === status,
    onSelect: () => {
      if (key !== status) onChange(key);
    },
  }));

  return (
    <ActionsMenu
      className="status-menu"
      label={`Reading status of ${title}`}
      items={items}
      renderTrigger={({ ref, open, toggle, listId }) => (
        <button
          ref={ref}
          type="button"
          className={`badge badge--${meta.variant} status-menu__trigger`}
          aria-label={`${meta.label}, change reading status of ${title}`}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={toggle}
        >
          <Icon size={14} aria-hidden="true" />
          <span className="badge__text">{meta.label}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      )}
    />
  );
}
