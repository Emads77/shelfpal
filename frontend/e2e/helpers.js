import { expect } from "@playwright/test";

// Every test gets its own user, so tests never share data.
// That makes runs repeatable in any order, and no run affects the next one.
export function uniqueUser() {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    username: `e2e_${id}`,
    email: `e2e_${id}@shelfpal.test`,
    password: "E2e!Shelfpal-Test-2026",
  };
}

// Registers through the API: faster than the UI, and registering is not what
// most tests are about.
export async function registerUser(request, user = uniqueUser()) {
  const response = await request.post("/api/auth/register/", {
    data: {
      username: user.username,
      email: user.email,
      password: user.password,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return user;
}

// Logs in through the real login form, the way a user does.
export async function loginViaUI(page, user) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

// Shortcut for tests that need a logged in user but don't test login itself.
export async function newLoggedInUser(page, request) {
  const user = await registerUser(request);
  await loginViaUI(page, user);
  return user;
}

// An access token for API level checks and for setting up data quickly.
export async function accessToken(request, user) {
  const response = await request.post("/api/auth/login/", {
    data: { email: user.email, password: user.password },
  });
  expect(response.status()).toBe(200);
  return (await response.json()).access;
}
