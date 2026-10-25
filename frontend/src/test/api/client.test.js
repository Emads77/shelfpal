import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import { server } from "../server.js";
import { ApiError, apiRequest, onSessionExpired } from "../../api/client.js";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../../api/tokenStorage.js";

const COPIES_URL = "*/copies/";
const REFRESH_URL = "*/auth/refresh/";

// Answers 200 only when the request carries a fresh access token
function copiesNeedFreshToken(calls) {
  return http.get(COPIES_URL, ({ request }) => {
    calls.copies += 1;
    if (request.headers.get("Authorization") === "Bearer new-access") {
      return HttpResponse.json([{ id: 1 }]);
    }
    return HttpResponse.json({ detail: "Token expired" }, { status: 401 });
  });
}

describe("US-01: API client session handling", () => {
  let stopListening;

  beforeEach(() => {
    clearTokens();
    setTokens({ access: "old-access", refresh: "refresh-1" });
  });

  afterEach(() => {
    stopListening?.();
    stopListening = undefined;
    clearTokens();
  });

  it("CT-07 retries the request after a successful refresh", async () => {
    const calls = { copies: 0 };
    const refreshBodies = [];
    server.use(
      copiesNeedFreshToken(calls),
      http.post(REFRESH_URL, async ({ request }) => {
        refreshBodies.push(await request.json());
        return HttpResponse.json({
          access: "new-access",
          refresh: "refresh-2",
        });
      }),
    );

    const data = await apiRequest("/copies/");

    expect(data).toEqual([{ id: 1 }]);
    expect(calls.copies).toBe(2);
    expect(refreshBodies).toEqual([{ refresh: "refresh-1" }]);
    expect(getAccessToken()).toBe("new-access");
    expect(getRefreshToken()).toBe("refresh-2");
  });

  it("CT-08 clears the tokens and calls the session expired handler when the refresh fails", async () => {
    const handler = vi.fn();
    stopListening = onSessionExpired(handler);
    const calls = { copies: 0 };
    server.use(
      http.get(COPIES_URL, () => {
        calls.copies += 1;
        return HttpResponse.json({ detail: "Token expired" }, { status: 401 });
      }),
      http.post(REFRESH_URL, () =>
        HttpResponse.json({ detail: "Token is invalid" }, { status: 401 }),
      ),
    );

    const error = await apiRequest("/copies/").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Session expired");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(calls.copies).toBe(1);
  });

  it("CT-09 refreshes only once when two requests get a 401 at the same time", async () => {
    const calls = { copies: 0 };
    let refreshCalls = 0;
    server.use(
      copiesNeedFreshToken(calls),
      http.post(REFRESH_URL, async () => {
        refreshCalls += 1;
        // Keeps the refresh in flight while the second 401 comes in
        await delay(50);
        return HttpResponse.json({
          access: "new-access",
          refresh: "refresh-2",
        });
      }),
    );

    const [first, second] = await Promise.all([
      apiRequest("/copies/"),
      apiRequest("/copies/"),
    ]);

    expect(first).toEqual([{ id: 1 }]);
    expect(second).toEqual([{ id: 1 }]);
    expect(refreshCalls).toBe(1);
    expect(calls.copies).toBe(4);
  });

  it("CT-10 turns a network failure into an ApiError with status 0 and a readable message", async () => {
    server.use(http.get(COPIES_URL, () => HttpResponse.error()));

    const error = await apiRequest("/copies/").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toBe(
      "Can't reach the server. Check your connection.",
    );
  });
});
