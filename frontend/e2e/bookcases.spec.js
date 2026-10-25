import { test, expect } from "@playwright/test";
import { accessToken, newLoggedInUser } from "./helpers.js";
import { listBookcases } from "./api.js";

test.describe("US-03: bookcases and shelves", () => {
  test("E2E-04 creates a bookcase, and it survives a reload", async ({
    page,
    request,
  }) => {
    const user = await newLoggedInUser(page, request);
    const token = await accessToken(request, user);

    await page.goto("/bookcases");
    await page
      .getByRole("button", { name: "Add bookcase", exact: true })
      .click();

    const form = page.getByRole("region", { name: "New bookcase" });
    await form.getByLabel("Bookcase name").fill("Study");
    await form.getByRole("button", { name: "Add bookcase" }).click();

    await expect(page.getByText("Study", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Study", { exact: true })).toBeVisible();

    const bookcases = await listBookcases(request, token);
    expect(bookcases.map((b) => b.name)).toEqual(["Study"]);
  });
});
