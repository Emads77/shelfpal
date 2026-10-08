import { ArrowRightLeft, Check, Circle, Trash2 } from "lucide-react";
import ActionsMenu from "../../shared/ui/ActionsMenu.jsx";
import Badge from "../../shared/ui/Badge.jsx";
import BookCover from "../collection/BookCover.jsx";
import "./copies.css";

export default function CopyCard({ copy, onMove, onDelete }) {
  const { book, is_read } = copy;

  return (
    <li className="card copy-card">
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
      </div>
    </li>
  );
}
