import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../server.js";
import CollectionPage from "../../features/collection/CollectionPage.jsx";

const COPIES_URL = "*/copies/";

const COPIES = [
  {
    id: 1,
    book: { id: 10, title: "Dune", author: "Frank Herbert", cover: "" },
    shelf: 3,
    location: {
      bookcase_id: 1,
      bookcase_name: "Living room",
      shelf_id: 3,
      shelf_name: "Top shelf",
    },
    status: "unread",
  },
  {
    id: 2,
    book: { id: 11, title: "Emma", author: "Jane Austen", cover: "" },
    shelf: null,
    location: null,
    status: "reading",
  },
  {
    id: 3,
    book: { id: 12, title: "Neuromancer", author: "William Gibson", cover: "" },
    shelf: 5,
    location: {
      bookcase_id: 2,
      bookcase_name: "Study",
      shelf_id: 5,
      shelf_name: "Sci-fi",
    },
    status: "finished",
  },
];

function renderCollection() {
  server.use(http.get(COPIES_URL, () => HttpResponse.json(COPIES)));
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<CollectionPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function bookLink(title) {
  return screen.queryByRole("link", { name: title });
}

describe("US-07: searching the collection", () => {
  it("CT-24 shows only books whose title or author matches, and the whole collection again when the box is emptied", async () => {
    const user = userEvent.setup();
    renderCollection();
    await screen.findByRole("link", { name: "Dune" });
    const search = screen.getByLabelText("Search your collection");

    await user.type(search, "  DUNE ");
    expect(bookLink("Dune")).toBeInTheDocument();
    expect(bookLink("Emma")).not.toBeInTheDocument();
    expect(bookLink("Neuromancer")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 3 books")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "gibson");
    expect(bookLink("Neuromancer")).toBeInTheDocument();
    expect(bookLink("Dune")).not.toBeInTheDocument();

    await user.clear(search);
    expect(bookLink("Dune")).toBeInTheDocument();
    expect(bookLink("Emma")).toBeInTheDocument();
    expect(bookLink("Neuromancer")).toBeInTheDocument();
    expect(screen.getByText("Showing 3 of 3 books")).toBeInTheDocument();
  });

  it("CT-25 shows the no match message for a search without results, and Clear filters shows the collection again", async () => {
    const user = userEvent.setup();
    renderCollection();
    await screen.findByRole("link", { name: "Dune" });
    const search = screen.getByLabelText("Search your collection");

    await user.type(search, "zzz");

    expect(
      screen.getByRole("heading", { name: "No books match" }),
    ).toBeInTheDocument();
    expect(bookLink("Dune")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(
      screen.queryByRole("heading", { name: "No books match" }),
    ).not.toBeInTheDocument();
    expect(search).toHaveValue("");
    expect(bookLink("Dune")).toBeInTheDocument();
    expect(bookLink("Emma")).toBeInTheDocument();
    expect(bookLink("Neuromancer")).toBeInTheDocument();
  });

  it("CT-26 shows each book's bookcase and shelf as a link to that shelf, and Unassigned without a shelf", async () => {
    renderCollection();
    await screen.findByRole("link", { name: "Dune" });

    const shelfLink = screen.getByRole("link", { name: /Top shelf/ });
    expect(shelfLink).toHaveTextContent("Living room");
    expect(shelfLink).toHaveAttribute("href", "/bookcases/1/shelves/3");

    expect(screen.getByRole("link", { name: "Unassigned" })).toHaveAttribute(
      "href",
      "/bookcases/unassigned",
    );
  });
});

describe("US-09: filtering the collection by reading status", async () => {
  it("CT-27 shows only books with the chosen status and marks that status as selected", async () => {
    const user = userEvent.setup();
    renderCollection();
    await screen.findByRole("link", { name: "Dune" });
    const filter = within(
      screen.getByRole("group", { name: "Reading status" }),
    );

    await user.click(filter.getByRole("button", { name: /^Reading/ }));

    expect(filter.getByRole("button", { name: /^Reading/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(bookLink("Emma")).toBeInTheDocument();
    expect(bookLink("Dune")).not.toBeInTheDocument();
    expect(bookLink("Neuromancer")).not.toBeInTheDocument();

    await user.click(filter.getByRole("button", { name: /^Finished/ }));

    expect(bookLink("Neuromancer")).toBeInTheDocument();
    expect(bookLink("Emma")).not.toBeInTheDocument();

    await user.click(filter.getByRole("button", { name: /^All/ }));

    expect(bookLink("Dune")).toBeInTheDocument();
    expect(bookLink("Emma")).toBeInTheDocument();
    expect(bookLink("Neuromancer")).toBeInTheDocument();
  });
});
