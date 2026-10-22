import { useId } from "react";
import { Link } from "react-router";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import ActionsMenu from "../../shared/ui/ActionsMenu.jsx";
import Badge from "../../shared/ui/Badge.jsx";
import BookCover from "../collection/BookCover.jsx";
import StatusMenu from "../collection/StatusMenu.jsx";
import { STATUS_META, statusOf } from "../collection/statusMeta";
import "./copies.css";

export default function CopyCard({
  copy,
  selecting = false,
  selected = false,
  onToggle,
  onMove,
  onDelete,
  onStatusChange,
}) {
  const { book } = copy;
  const statusKey = statusOf(copy);
  const status = STATUS_META[statusKey];
  const checkId = useId();

  return (
    <li className={`card copy-card${selected ? " copy-card--selected" : ""}`}>
      <BookCover title={book.title} coverUrl={book.cover} />
      <div className="copy-card__body">
        <h2 className="copy-card__title">
          {selecting ? (
            book.title
          ) : (
            <Link to={`/books/${copy.id}`}>{book.title}</Link>
          )}
        </h2>
        <p className="copy-card__author">{book.author}</p>
        <div className="copy-card__meta">
          {selecting ? (
            <Badge variant={status.variant} icon={status.icon}>
              {status.label}
            </Badge>
          ) : (
            <StatusMenu
              status={statusKey}
              title={book.title}
              onChange={(next) => onStatusChange(copy, next)}
            />
          )}
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
