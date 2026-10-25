import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../server.js";
import BookcasesPage from "../../features/bookcases/BookcasesPage.jsx";

const OVERVIEW_URL = "*/overview/";

const emptyOverview = { bookcases: [], unassigned_count: 0 };

function overviewReturns(body, status = 200) {
  return http.get(OVERVIEW_URL, () => HttpResponse.json(body, { status }));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <BookcasesPage />
    </MemoryRouter>,
  );
}

describe("US-03: bookcases overview", () => {
  it("shows a loading message, then the empty state when there are no bookcases", async () => {
    server.use(overviewReturns(emptyOverview));
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading your bookcases...",
    );
    expect(await screen.findByText("No bookcases yet")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("opens the add bookcase form from the empty state", async () => {
    server.use(overviewReturns(emptyOverview));
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Add your first bookcase" }),
    );

    expect(screen.getByLabelText("Bookcase name")).toBeInTheDocument();
    expect(screen.queryByText("No bookcases yet")).not.toBeInTheDocument();
  });

  it("shows an error with a retry button when loading fails, and recovers on retry", async () => {
    server.use(overviewReturns(emptyOverview));
    server.use(
      http.get(
        OVERVIEW_URL,
        () => HttpResponse.json({ detail: "Server error" }, { status: 500 }),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load your bookcases",
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("No bookcases yet")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
