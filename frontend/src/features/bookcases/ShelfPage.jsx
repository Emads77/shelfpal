import { Navigate, useParams } from "react-router";
import BookListPage from "./BookListPage.jsx";

export default function ShelfPage() {
  const params = useParams();
  const bookcaseId = Number(params.bookcaseId);
  const shelfId = Number(params.shelfId);

  if (!Number.isInteger(bookcaseId) || !Number.isInteger(shelfId)) {
    return <Navigate to="/bookcases" replace />;
  }

  return (
    <BookListPage key={shelfId} bookcaseId={bookcaseId} shelfId={shelfId} />
  );
}
