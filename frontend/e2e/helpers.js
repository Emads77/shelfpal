import { expect } from "@playwright/test";
import { listCopies } from "./api.js";

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

// The seed command creates shared catalogue books, and a user (collector) who
// owns copies of them. Reading the book from that collection avoids the lookup
// endpoint, which would call the real OpenLibrary for a book that is missing.
export async function catalogueBook(request, title = "Pride and Prejudice") {
  const password = process.env.SEED_USER_PASSWORD;
  if (!password) {
    throw new Error(
      "Set SEED_USER_PASSWORD to the password used for `manage.py seed`.",
    );
  }
  const token = await accessToken(request, {
    email: "collector@shelfpal.test",
    password,
  });
  const copy = (await listCopies(request, token)).find(
    (c) => c.book.title === title,
  );
  expect(copy, `The seed has no copy of "${title}"`).toBeTruthy();
  return copy.book;
}
