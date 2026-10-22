export const EMPTY_BOOK = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  cover: "",
};

export const BOOK_FIELD_NAMES = Object.keys(EMPTY_BOOK);

export function validateBook(book) {
  const errors = {};
  if (!book.title.trim()) errors.title = ["Title is required."];
  if (!book.author.trim()) errors.author = ["Author is required."];
  return errors;
}

export function bookPayload(book) {
  return {
    title: book.title.trim(),
    author: book.author.trim(),
    isbn: book.isbn.trim(),
    publisher: book.publisher.trim(),
    cover: book.cover.trim(),
  };
}

export function bookFromCopy(book) {
  return {
    title: book.title,
    author: book.author,
    isbn: book.isbn ?? "",
    publisher: book.publisher ?? "",
    cover: book.cover ?? "",
  };
}
