import { Link } from "react-router";
import { placeOf } from "./placeOf.js";
import Badge from "../../shared/ui/Badge.jsx";
import BookCover from "./BookCover.jsx";
import { STATUS_META, statusOf } from "./statusMeta.js";
import "./collection.css";

export default function BookCard({ copy }) {
  const { book } = copy;
  const meta = STATUS_META[statusOf(copy)];
  const place = placeOf(copy.location);
  const PlaceIcon = place.icon;
  const placeLabel = place.bookcase
    ? `${place.bookcase} · ${place.shelf}`
    : place.shelf;
  const detailPath = `/books/${copy.id}`;

  return (
    <li className="card book-card">
      <BookCover title={book.title} coverUrl={book.cover} />
      <div className="book-card__body">
        <h3 className="book-card__title">
          <Link to={detailPath}>{book.title}</Link>
        </h3>
        {book.series && (
          <p className="book-card__series">
            {book.series}
            {book.series_position ? ` #${book.series_position}` : ""}
          </p>
        )}
        <p className="book-card__author">{book.author}</p>
        {book.page_count ? (
          <p className="book-card__pages">
            {book.page_count.toLocaleString("en")} pages
          </p>
        ) : null}
        <div className="book-card__meta">
          <Badge variant={meta.variant} icon={meta.icon}>
            {meta.label}
          </Badge>
          <Link
            to={place.to}
            className="book-card__location"
            title={placeLabel}
          >
            <PlaceIcon size={14} aria-hidden="true" />
            {place.bookcase && (
              <>
                <span className="book-card__place-bookcase">
                  {place.bookcase}
                </span>
                <span className="book-card__place-sep" aria-hidden="true">
                  ·
                </span>
                <span className="visually-hidden">, </span>
              </>
            )}
            <span className="book-card__place-shelf">{place.shelf}</span>
          </Link>
        </div>
      </div>
    </li>
  );
}
