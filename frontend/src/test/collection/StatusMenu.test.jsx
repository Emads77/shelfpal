import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../server.js";
import BookDetailPage from "../../features/collection/BookDetailPage.jsx";

const COPY_URL = "*/copies/1/";
const UNREAD_TRIGGER = "Unread, change reading status of Dune";
const FINISHED_TRIGGER = "Finished, change reading status of Dune";

const copy = {
  id: 1,
  book: {
    id: 10,
    isbn: "9780441172719",
    title: "Dune",
    author: "Frank Herbert",
    publisher: "Ace",
    cover: "",
  },
  shelf: 5,
  location: {
    bookcase_id: 2,
    bookcase_name: "Living room",
    shelf_id: 5,
    shelf_name: "Top shelf",
  },
  status: "unread",
  is_signed: false,
  edition_number: null,
  edition_size: null,
};

function renderDetailPage() {
  return render(
    <MemoryRouter initialEntries={["/books/1"]}>
      <Routes>
        <Route path="/books/:copyId" element={<BookDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("US-09: changing the reading status", () => {
  it("CT-13 shows the current status and sends a PATCH when another one is chosen", async () => {
    const patchBodies = [];
    server.use(
      http.get(COPY_URL, () => HttpResponse.json(copy)),
      http.patch(COPY_URL, async ({ request }) => {
        patchBodies.push(await request.json());
        return HttpResponse.json({ ...copy, status: "finished" });
      }),
    );
    const user = userEvent.setup({ delay: null });
    renderDetailPage();

    await user.click(
      await screen.findByRole("button", { name: UNREAD_TRIGGER }),
    );
    expect(screen.getByRole("button", { name: "Unread" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Finished" }));

    expect(
      await screen.findByRole("button", { name: FINISHED_TRIGGER }),
    ).toBeInTheDocument();
    await waitFor(() => expect(patchBodies).toEqual([{ status: "finished" }]));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("CT-14 shows an error and restores the previous status when the change fails", async () => {
    server.use(
      http.get(COPY_URL, () => HttpResponse.json(copy)),
      http.patch(COPY_URL, () =>
        HttpResponse.json(
          { detail: "The status could not be saved." },
          { status: 500 },
        ),
      ),
    );
    const user = userEvent.setup({ delay: null });
    renderDetailPage();

    await user.click(
      await screen.findByRole("button", { name: UNREAD_TRIGGER }),
    );
    await user.click(screen.getByRole("button", { name: "Finished" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The status could not be saved.",
    );
    expect(
      screen.getByRole("button", { name: UNREAD_TRIGGER }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: FINISHED_TRIGGER }),
    ).not.toBeInTheDocument();
  });
});
