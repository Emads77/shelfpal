import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../server.js";
import AddBookPage from "../../features/books/AddBookPage.jsx";

const OVERVIEW_URL = "*/overview/";
const COPIES_URL = "*/copies/";

const OVERVIEW = {
  bookcases: [
    { id: 1, name: "Living room", shelves: [{ id: 3, name: "Top shelf" }] },
  ],
};

function renderAddBook() {
  return render(
    <MemoryRouter initialEntries={["/books/new"]}>
      <Routes>
        <Route path="/books/new" element={<AddBookPage />} />
        <Route path="/bookcases/1/shelves/3" element={<p>Top shelf page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("US-04: Add a book manually", () => {
  beforeEach(() => localStorage.clear());

  it("CT-15 shows the title and author errors and sends nothing when they are empty", async () => {
    const postedBodies = [];
    server.use(
      http.get(OVERVIEW_URL, () => HttpResponse.json(OVERVIEW)),
      http.post(COPIES_URL, async ({ request }) => {
        postedBodies.push(await request.json());
        return HttpResponse.json({ id: 5, shelf: null }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderAddBook();
    await screen.findByRole("option", { name: "Top shelf" });

    await user.click(screen.getByRole("button", { name: "Add book" }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Author is required.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Title")).toHaveFocus());
    expect(postedBodies).toHaveLength(0);
  });

  it("CT-16 sends the trimmed fields and the chosen shelf, then opens that shelf", async () => {
    const postedBodies = [];
    server.use(
      http.get(OVERVIEW_URL, () => HttpResponse.json(OVERVIEW)),
      http.post(COPIES_URL, async ({ request }) => {
        const body = await request.json();
        postedBodies.push(body);
        return HttpResponse.json({ id: 5, shelf: body.shelf }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderAddBook();
    await screen.findByRole("option", { name: "Top shelf" });

    await user.type(screen.getByLabelText("Title"), "  Dune  ");
    await user.type(screen.getByLabelText("Author"), "  Frank Herbert ");
    await user.selectOptions(screen.getByLabelText("Shelf"), "Top shelf");
    await user.click(screen.getByRole("button", { name: "Add book" }));

    expect(await screen.findByText("Top shelf page")).toBeInTheDocument();
    expect(postedBodies).toHaveLength(1);
    expect(postedBodies[0]).toEqual(
      expect.objectContaining({
        title: "Dune",
        author: "Frank Herbert",
        shelf: 3,
        is_signed: false,
        edition_number: null,
        edition_size: null,
      }),
    );
  });
});
