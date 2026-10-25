import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OfflineBanner from "../../shared/ui/OfflineBanner.jsx";

describe("US-10: the user sees when the library is shown from cache", () => {
  it("shows the banner when the connection drops and hides it when it returns", () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).toBeNull();

    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByRole("status")).toHaveTextContent("You're offline");

    act(() => window.dispatchEvent(new Event("online")));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
