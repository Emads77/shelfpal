import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OfflineBanner from "../../shared/ui/OfflineBanner.jsx";

describe("Offline: the user sees when the library is shown from cache", () => {
  afterEach(cleanup);

  it("shows the banner when the connection drops and hides it when it returns", () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).toBeNull();

    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByRole("status")).toHaveTextContent("You're offline");

    act(() => window.dispatchEvent(new Event("online")));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
