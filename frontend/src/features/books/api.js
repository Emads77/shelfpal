import { apiRequest } from "../../api/client.js";

export function addBookManually(data) {
  return apiRequest("/copies/", { method: "POST", body: data });
}

export function lookupBook(isbn) {
  return apiRequest(`/books/lookup/?isbn=${encodeURIComponent(isbn)}`);
}

export function addCopyFromBook(bookId, shelfId) {
  return apiRequest("/copies/", {
    method: "POST",
    body: { book: bookId, shelf: shelfId },
  });
}
