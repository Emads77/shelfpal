import { describe, expect, it } from "vitest";
import {
  EMPTY_BOOK,
  bookFromCopy,
  bookPayload,
  validateBook,
} from "../../features/books/bookFields.js";

const validBook = {
  ...EMPTY_BOOK,
  title: "Dune",
  author: "Frank Herbert",
};

describe("US-04 and US-05: book field validation", () => {
  it("returns no errors for a book with title and author", () => {
    expect(validateBook(validBook)).toEqual({});
  });

  it("requires a title", () => {
    const errors = validateBook({ ...validBook, title: "" });
    expect(errors.title).toEqual(["Title is required."]);
  });

  it("treats a title with only spaces as empty", () => {
    const errors = validateBook({ ...validBook, title: "   " });
    expect(errors.title).toEqual(["Title is required."]);
  });

  it("requires an author", () => {
    const errors = validateBook({ ...validBook, author: "" });
    expect(errors.author).toEqual(["Author is required."]);
  });

  it("reports both errors when title and author are missing", () => {
    expect(Object.keys(validateBook(EMPTY_BOOK))).toEqual(["title", "author"]);
  });
});

describe("US-04 and US-05: payload sent to the API", () => {
  it("trims whitespace from every field", () => {
    const payload = bookPayload({
      title: "  Dune ",
      author: " Frank Herbert",
      isbn: " 9780441013593 ",
      publisher: "Ace ",
      cover: " https://example.com/dune.jpg",
    });

    expect(payload).toEqual({
      title: "Dune",
      author: "Frank Herbert",
      isbn: "9780441013593",
      publisher: "Ace",
      cover: "https://example.com/dune.jpg",
    });
  });
});

describe("US-05: loading an existing book into the edit form", () => {
  it("turns missing optional fields into empty strings", () => {
    const fromApi = {
      id: 7,
      title: "Dune",
      author: "Frank Herbert",
      isbn: null,
    };

    expect(bookFromCopy(fromApi)).toEqual({
      title: "Dune",
      author: "Frank Herbert",
      isbn: "",
      publisher: "",
      cover: "",
    });
  });

  it("keeps filled fields and drops fields the form does not use", () => {
    const fromApi = {
      id: 7,
      title: "Dune",
      author: "Frank Herbert",
      isbn: "9780441013593",
      publisher: "Ace",
      cover: "https://example.com/dune.jpg",
      copied_from: 3,
    };

    expect(bookFromCopy(fromApi)).toEqual({
      title: "Dune",
      author: "Frank Herbert",
      isbn: "9780441013593",
      publisher: "Ace",
      cover: "https://example.com/dune.jpg",
    });
  });
});
