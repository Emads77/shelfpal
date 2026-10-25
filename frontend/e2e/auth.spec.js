import { test, expect } from "@playwright/test";
import { loginViaUI, registerUser, uniqueUser } from "./helpers";

test.describe("US-01: register and log in", () => {
  test("E2E-01 logs in and logs out", async ({ page, request }) => {
    const user = await registerUser(request);

    await loginViaUI(page, user);
    await expect(page.getByRole("heading", { name: "Log in" })).toHaveCount(0);

    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("button", { name: "Log out" }).click();

    // After logout a protected page must send the user back to the login page.
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("E2E-02 a wrong password shows an error and stays on the login page", async ({
    page,
    request,
  }) => {
    const user = await registerUser(request);

    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("definitely-the-wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("E2E-03 anonymous API requests to copies are rejected", async ({
    request,
  }) => {
    const list = await request.get("/api/copies/");
    expect(list.status()).toBe(401);

    const patch = await request.patch("/api/copies/1/", {
      data: { status: "finished" },
    });
    expect(patch.status()).toBe(401);
  });

  test("E2E-03b an unknown user cannot log in through the API", async ({
    request,
  }) => {
    const stranger = uniqueUser();
    const response = await request.post("/api/auth/login/", {
      data: { email: stranger.email, password: stranger.password },
    });
    expect(response.status()).toBe(401);
  });
});
