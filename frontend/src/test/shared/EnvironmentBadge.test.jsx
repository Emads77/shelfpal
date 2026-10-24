import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import EnvironmentBadge from "../../shared/ui/EnvironmentBadge.jsx";

describe("Environment: the user knows which environment they are using", () => {
  afterEach(cleanup);

  it("shows acceptance with a link to production", () => {
    render(<EnvironmentBadge hostname="acc.shelfpal.saxion.college" />);
    expect(screen.getByRole("note")).toHaveTextContent(
      "Acceptance environment",
    );
    expect(
      screen.getByRole("link", { name: "Go to production" }),
    ).toHaveAttribute("href", "https://shelfpal.saxion.college");
  });

  it("shows only a quiet link to acceptance on production", () => {
    render(<EnvironmentBadge hostname="shelfpal.saxion.college" />);
    expect(screen.getByRole("link", { name: "Acceptance" })).toHaveAttribute(
      "href",
      "https://acc.shelfpal.saxion.college",
    );
  });
});
