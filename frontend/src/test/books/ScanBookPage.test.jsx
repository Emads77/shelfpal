import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../server.js";
import ScanBookPage from "../../features/books/ScanBookPage.jsx";

const OVERVIEW_URL = "*/overview/";
const LOOKUP_URL = "*/books/lookup/";
const COPIES_URL = "*/copies/";

// The cover is empty on purpose: jsdom never loads images, and the page
// would wait up to 4 seconds for a cover URL.
const FOUND_BOOK = {
  id: 7,
  title: "Dune",
  author: "Frank Herbert",
  publisher: "Ace",
  cover: "",
};

function renderScan() {
  return render(
    <MemoryRouter initialEntries={["/books/scan"]}>
      <Routes>
        <Route path="/books/scan" element={<ScanBookPage />} />
        <Route path="/bookcases/unassigned" element={<p>Unassigned page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function lookUp(user, isbn) {
  await user.type(screen.getByLabelText("Or type the ISBN"), isbn);
  await user.click(screen.getByRole("button", { name: "Look up" }));
}

describe("US-02: adding a book by ISBN", () => {
  beforeEach(() => {
    localStorage.clear();
    server.use(
      http.get(OVERVIEW_URL, () => HttpResponse.json({ bookcases: [] })),
    );
  });

  it("CT-17 shows the found book and adds it using its id", async () => {
    const lookedUpIsbns = [];
    const postedBodies = [];
    server.use(
      http.get(LOOKUP_URL, ({ request }) => {
        lookedUpIsbns.push(new URL(request.url).searchParams.get("isbn"));
        return HttpResponse.json(FOUND_BOOK);
      }),
      http.post(COPIES_URL, async ({ request }) => {
        postedBodies.push(await request.json());
        return HttpResponse.json({ id: 5, shelf: null }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderScan();

    await lookUp(user, "9780441013593");

    const found = await screen.findByRole("region", { name: "Book found" });
    expect(found).toHaveTextContent("Dune");
    expect(found).toHaveTextContent("Frank Herbert");
    expect(lookedUpIsbns).toEqual(["9780441013593"]);

    await user.click(
      screen.getByRole("button", { name: "Add to my collection" }),
    );

    expect(await screen.findByText("Unassigned page")).toBeInTheDocument();
    expect(postedBodies).toHaveLength(1);
    expect(postedBodies[0]).toEqual(expect.objectContaining({ book: 7 }));
  });

  it("CT-18 shows a message and a link to enter the book by hand when the ISBN is not found", async () => {
    server.use(
      http.get(LOOKUP_URL, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    renderScan();

    await lookUp(user, "9780441013593");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't find a book with this ISBN.",
    );
    expect(
      screen.getByRole("link", { name: "Enter the book by hand" }),
    ).toHaveAttribute("href", "/books/new");
    expect(
      screen.queryByRole("region", { name: "Book found" }),
    ).not.toBeInTheDocument();
  });

  it("CT-18 shows a message and adds nothing when the lookup service is unavailable", async () => {
    const postedBodies = [];
    server.use(
      http.get(LOOKUP_URL, () =>
        HttpResponse.json({ detail: "Unavailable." }, { status: 503 }),
      ),
      http.post(COPIES_URL, async ({ request }) => {
        postedBodies.push(await request.json());
        return HttpResponse.json({ id: 5, shelf: null }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderScan();

    await lookUp(user, "9780441013593");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't look up this book right now.",
    );
    expect(postedBodies).toHaveLength(0);
  });
});
