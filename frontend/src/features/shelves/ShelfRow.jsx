import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ActionsMenu from "../../shared/ui/ActionsMenu.jsx";
import CoverStrip from "./CoverStrip.jsx";
import NameForm from "./NameForm.jsx";
import { pluralize } from "./pluralize.js";
import "./shelves.css";

export default function ShelfRow({ shelf, onRename, onRequestDelete }) {
  const [renaming, setRenaming] = useState(false);
  const menuRef = useRef(null);
  const wasRenaming = useRef(false);

  useEffect(() => {
    if (wasRenaming.current && !renaming) menuRef.current?.focus();
    wasRenaming.current = renaming;
  }, [renaming]);

  return (
    <li className="shelf-row">
      <div className="shelf-row__top">
        {renaming ? (
          <NameForm
            label={`New name for shelf ${shelf.name}`}
            initialValue={shelf.name}
            submitLabel="Save"
            autoFocus
            onSubmit={async (name) => {
              await onRename(name);
              setRenaming(false);
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <h3 className="shelf-row__name">{shelf.name}</h3>
            <div className="shelf-row__meta">
              <p className="shelf-row__count">
                {pluralize(shelf.book_count, "book")}
              </p>
              <ActionsMenu
                label={`Actions for shelf ${shelf.name}`}
                triggerRef={menuRef}
                items={[
                  {
                    key: "rename",
                    label: "Rename",
                    icon: Pencil,
                    onSelect: () => setRenaming(true),
                  },
                  {
                    key: "delete",
                    label: "Delete",
                    icon: Trash2,
                    danger: true,
                    onSelect: onRequestDelete,
                  },
                ]}
              />
            </div>
          </>
        )}
      </div>
      <CoverStrip covers={shelf.preview_covers} total={shelf.book_count} />
    </li>
  );
}
