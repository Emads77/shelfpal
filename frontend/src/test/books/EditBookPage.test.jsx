import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../server.js";
import EditBookPage from "../../features/books/EditBookPage.jsx";

const COPY_URL = "*/copies/1/";

// publisher and cover are null on purpose: the form must show them as empty
const COPY = {
  id: 1,
  book: {
    id: 10,
    isbn: "9780441013593",
    title: "Dune",
    author: "Frank Herbert",
    publisher: null,
    cover: null,
  },
  shelf: null,
  location: null,
  status: "unread",
  is_signed: true,
  edition_number: 5,
  edition_size: 100,
};

function renderEdit() {
  return render(
    <MemoryRouter initialEntries={["/books/1/edit"]}>
      <Routes>
        <Route path="/books/:copyId/edit" element={<EditBookPage />} />
        <Route path="/books/:copyId" element={<p>Book detail page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("US-05: editing a book", () => {
  it("CT-19 fills the form with the book and edition details of the copy", async () => {
    server.use(http.get(COPY_URL, () => HttpResponse.json(COPY)));
    renderEdit();

    expect(await screen.findByLabelText("Title")).toHaveValue("Dune");
    expect(screen.getByLabelText("Author")).toHaveValue("Frank Herbert");
    expect(screen.getByLabelText("ISBN (optional)")).toHaveValue(
      "9780441013593",
    );
    expect(screen.getByLabelText("Publisher (optional)")).toHaveValue("");
    expect(screen.getByLabelText("Cover URL (optional)")).toHaveValue("");
    expect(screen.getByLabelText("Signed")).toBeChecked();
    expect(screen.getByLabelText("Numbered")).toBeChecked();
    expect(screen.getByLabelText("Your number")).toHaveValue("5");
    expect(screen.getByLabelText("Out of")).toHaveValue("100");
  });

  it("CT-20 sends a PATCH with the edited fields and returns to the book", async () => {
    const patchBodies = [];
    server.use(
      http.get(COPY_URL, () => HttpResponse.json(COPY)),
      http.patch(COPY_URL, async ({ request }) => {
        patchBodies.push(await request.json());
        return HttpResponse.json(COPY);
      }),
    );
    const user = userEvent.setup();
    renderEdit();

    const title = await screen.findByLabelText("Title");
    await user.clear(title);
    await user.type(title, "  Dune Messiah  ");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText("Book detail page")).toBeInTheDocument();
    expect(patchBodies).toHaveLength(1);
    expect(patchBodies[0]).toEqual(
      expect.objectContaining({
        title: "Dune Messiah",
        author: "Frank Herbert",
        is_signed: true,
        edition_number: 5,
        edition_size: 100,
      }),
    );
  });
});
