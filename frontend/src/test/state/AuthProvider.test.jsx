import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { http, HttpResponse } from "msw";
import { server } from "../server.js";
import { apiRequest } from "../../api/client.js";
import { clearTokens, setTokens } from "../../api/tokenStorage.js";
import { AuthProvider } from "../../state/AuthProvider.jsx";
import { AuthContext } from "../../state/authContext.js";

const ME_URL = "*/auth/me/";
const LOGOUT_URL = "*/auth/logout/";
const REFRESH_URL = "*/auth/refresh/";
const COPIES_URL = "*/copies/";

const ME = { id: 1, username: "reader", email: "reader@example.com" };

function Probe() {
  const { status, logout } = useContext(AuthContext);
  return (
    <>
      <p>Status: {status}</p>
      <button onClick={logout}>Log out</button>
      {/* Any API call that comes back 401 ends the session */}
      <button onClick={() => apiRequest("/copies/").catch(() => {})}>
        Load copies
      </button>
    </>
  );
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe("US-10: the cached library is removed when the session ends", () => {
  let deleteCache;

  beforeEach(() => {
    clearTokens();
    setTokens({ access: "access-1", refresh: "refresh-1" });
    // jsdom has no Cache storage
    deleteCache = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("caches", { delete: deleteCache });
    server.use(http.get(ME_URL, () => HttpResponse.json(ME)));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearTokens();
  });

  it("CT-23 clears the cached API data on logout", async () => {
    server.use(http.post(LOGOUT_URL, () => HttpResponse.json({})));
    const user = userEvent.setup();
    renderProbe();
    await screen.findByText("Status: authenticated");
    expect(deleteCache).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByText("Status: anonymous")).toBeInTheDocument();
    expect(deleteCache).toHaveBeenCalledWith("api");
  });

  it("CT-23 clears the cached API data when the session expires", async () => {
    server.use(
      http.get(COPIES_URL, () =>
        HttpResponse.json({ detail: "Token expired" }, { status: 401 }),
      ),
      http.post(REFRESH_URL, () =>
        HttpResponse.json({ detail: "Token is invalid" }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderProbe();
    await screen.findByText("Status: authenticated");
    expect(deleteCache).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Load copies" }));

    expect(await screen.findByText("Status: anonymous")).toBeInTheDocument();
    expect(deleteCache).toHaveBeenCalledWith("api");
  });
});
