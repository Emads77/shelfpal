import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../server.js";
import BookDetailPage from "../../features/collection/BookDetailPage.jsx";

const COPY_URL = "*/copies/1/";
const DELETE_URL = "*/copies/delete/";
const DIALOG_NAME = "Delete “Dune”?";

const COPY = {
  id: 1,
  book: {
    id: 10,
    isbn: "9780441013593",
    title: "Dune",
    author: "Frank Herbert",
    publisher: "Ace",
    cover: "",
  },
  shelf: null,
  location: null,
  status: "unread",
  is_signed: false,
  edition_number: null,
  edition_size: null,
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={["/books/1"]}>
      <Routes>
        <Route path="/books/:copyId" element={<BookDetailPage />} />
        <Route path="/" element={<p>Collection page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function openDeleteDialog(user) {
  await user.click(
    await screen.findByRole("button", { name: "Actions for Dune" }),
  );
  await user.click(screen.getByRole("button", { name: "Delete" }));
  return screen.findByRole("dialog", { name: DIALOG_NAME });
}

describe("US-06: removing a book", () => {
  it("CT-21 asks for confirmation before deleting, and cancel keeps the book", async () => {
    const deleteBodies = [];
    server.use(
      http.get(COPY_URL, () => HttpResponse.json(COPY)),
      http.post(DELETE_URL, async ({ request }) => {
        deleteBodies.push(await request.json());
        return HttpResponse.json({ count: 1 });
      }),
    );
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole("heading", { level: 1, name: "Dune" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const dialog = await openDeleteDialog(user);

    expect(dialog).toHaveTextContent(
      "It will be removed from your collection.",
    );
    expect(deleteBodies).toHaveLength(0);

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Dune" }),
    ).toBeInTheDocument();
    expect(deleteBodies).toHaveLength(0);
  });

  it("CT-21 confirming sends the delete request for the copy and leaves the page", async () => {
    const deleteBodies = [];
    server.use(
      http.get(COPY_URL, () => HttpResponse.json(COPY)),
      http.post(DELETE_URL, async ({ request }) => {
        deleteBodies.push(await request.json());
        return HttpResponse.json({ count: 1 });
      }),
    );
    const user = userEvent.setup();
    renderDetail();

    const dialog = await openDeleteDialog(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Delete book" }),
    );

    expect(await screen.findByText("Collection page")).toBeInTheDocument();
    expect(deleteBodies).toEqual([{ ids: [1] }]);
  });
});
