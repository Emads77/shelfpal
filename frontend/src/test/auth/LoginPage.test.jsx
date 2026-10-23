import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../server.js";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "../../api/tokenStorage.js";
import LoginPage from "../../features/auth/LoginPage.jsx";
import { AuthProvider } from "../../state/AuthProvider.jsx";

const LOGIN_URL = "*/auth/login/";
const ME_URL = "*/auth/me/";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Home page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function fillAndSubmit(user, email, password) {
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Log in" }));
}

describe("US-01: logging in", () => {
  beforeEach(() => clearTokens());
  afterEach(() => clearTokens());

  it("CT-11 shows the server error on wrong credentials", async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, "reader@example.com", "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password.",
    );
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("CT-12 stores the tokens and navigates on success", async () => {
    const loginBodies = [];
    server.use(
      http.post(LOGIN_URL, async ({ request }) => {
        loginBodies.push(await request.json());
        return HttpResponse.json({ access: "access-1", refresh: "refresh-1" });
      }),
      http.get(ME_URL, ({ request }) => {
        // Only answers when the new token was stored before this request
        if (request.headers.get("Authorization") !== "Bearer access-1") {
          return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
        }
        return HttpResponse.json({
          id: 1,
          username: "reader",
          email: "reader@example.com",
        });
      }),
    );
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, "Reader@example.com", "secret-password");

    expect(await screen.findByText("Home page")).toBeInTheDocument();
    expect(loginBodies).toEqual([
      { email: "reader@example.com", password: "secret-password" },
    ]);
    expect(getAccessToken()).toBe("access-1");
    expect(getRefreshToken()).toBe("refresh-1");
  });
});
