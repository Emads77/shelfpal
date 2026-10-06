import { Library } from "lucide-react";
import Badge from "../../shared/ui/Badge.jsx";
import BookCover from "./BookCover.jsx";
import { STATUS_META } from "./statusMeta.js";
import "./collection.css";

export default function BookCard({ copy }) {
  const { book, shelf, status } = copy;
  const meta = STATUS_META[status];

  return (
    <li className="card book-card">
      <BookCover title={book.title} coverUrl={book.coverUrl} />
      <div className="book-card__body">
        <h3 className="book-card__title">{book.title}</h3>
        {book.series && (
          <p className="book-card__series">
            {book.series}
            {book.seriesPosition ? ` #${book.seriesPosition}` : ""}
          </p>
        )}
        <p className="book-card__author">{book.author}</p>
        <div className="book-card__meta">
          <Badge variant={meta.variant} icon={meta.icon}>
            {meta.label}
          </Badge>
          <Badge icon={Library}>
            {shelf.bookcase} · {shelf.name}
          </Badge>
        </div>
      </div>
    </li>
  );
}
