import { useId } from "react";
import { ArrowRightLeft, Check, Circle, Trash2 } from "lucide-react";
import ActionsMenu from "../../shared/ui/ActionsMenu.jsx";
import Badge from "../../shared/ui/Badge.jsx";
import BookCover from "../collection/BookCover.jsx";
import "./copies.css";

export default function CopyCard({
  copy,
  selecting = false,
  selected = false,
  onToggle,
  onMove,
  onDelete,
}) {
  const { book, is_read } = copy;
  const checkId = useId();

  return (
    <li className={`card copy-card${selected ? " copy-card--selected" : ""}`}>
      <BookCover title={book.title} coverUrl={book.cover} />
      <div className="copy-card__body">
        <h2 className="copy-card__title">{book.title}</h2>
        <p className="copy-card__author">{book.author}</p>
        <div className="copy-card__meta">
          <Badge
            variant={is_read ? "soft" : "outline"}
            icon={is_read ? Check : Circle}
          >
            {is_read ? "Read" : "Unread"}
          </Badge>
        </div>
      </div>
      <div className="copy-card__menu">
        {selecting ? (
          <input
            id={checkId}
            type="checkbox"
            className="copy-card__check"
            checked={selected}
            onChange={onToggle}
          />
        ) : (
          <ActionsMenu
            label={`Actions for ${book.title}`}
            items={[
              {
                key: "move",
                label: "Move to...",
                icon: ArrowRightLeft,
                onSelect: onMove,
              },
              {
                key: "delete",
                label: "Delete",
                icon: Trash2,
                danger: true,
                onSelect: onDelete,
              },
            ]}
          />
        )}
      </div>
      {selecting && (
        <label htmlFor={checkId} className="copy-card__pick">
          <span className="copy-card__sr">Select {book.title}</span>
        </label>
      )}
    </li>
  );
}
