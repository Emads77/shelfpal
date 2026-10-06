import { coverPalette } from "./coverPalette.js";
import "./collection.css";

export default function BookCover({ title, coverUrl }) {
  if (coverUrl) {
    return <img className="book-cover" src={coverUrl} alt="" loading="lazy" />;
  }

  const { background, color } = coverPalette(title);
  return (
    <div
      className="book-cover book-cover--generated"
      style={{ background, color }}
      aria-hidden="true"
      >
      <span>{title}</span>
    </div>
  );
}
