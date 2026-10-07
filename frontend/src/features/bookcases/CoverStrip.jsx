import BookCover from "../collection/BookCover.jsx";
import "./bookcases.css";

const PHONE_VISIBLE = 4;

export default function CoverStrip({ covers, total }) {
  const hiddenOnPhone = total - Math.min(covers.length, PHONE_VISIBLE);
  const hiddenOnDesktop = total - covers.length;

  return (
    <div
      className={`cover-strip ${covers.length === 0 ? "cover-strip--empty" : ""}`.trim()}
      aria-hidden="true"
    >
      <div className="cover-strip__books">
        {covers.length === 0 && (
          <span className="cover-strip__empty-text">No books yet</span>
        )}
        {covers.map((preview) => (
          <div key={preview.id} className="cover-strip__book">
            <BookCover title={preview.title} coverUrl={preview.cover} />
          </div>
        ))}
        {hiddenOnPhone > 0 && (
          <span className="cover-strip__more cover-strip__more--phone">
            +{hiddenOnPhone}
          </span>
        )}
        {hiddenOnDesktop > 0 && (
          <span className="cover-strip__more cover-strip__more--desktop">
            +{hiddenOnDesktop}
          </span>
        )}
      </div>
      <div className="cover-strip__board" />
    </div>
  );
}
