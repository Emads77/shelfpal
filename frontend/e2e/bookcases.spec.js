import { test, expect } from "@playwright/test";
import { accessToken, newLoggedInUser } from "./helpers.js";
import { createBookcase, listBookcases, listShelves } from "./api.js";

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

  test("E2E-13 adds shelves to a bookcase, renames one and deletes one", async ({
    page,
    request,
  }) => {
    const user = await newLoggedInUser(page, request);
    const token = await accessToken(request, user);
    const bookcase = await createBookcase(request, token, "Living room");
    const shelfNames = async () =>
      (await listShelves(request, token, bookcase.id)).map((s) => s.name);

    await page.goto("/bookcases");
    await page.getByRole("button", { name: /^Living room/ }).click();
    await expect(page.getByText("This bookcase has no shelves yet.")).toBeVisible();

    // Add two shelves
    await page
      .getByRole("button", { name: "Add a shelf to Living room" })
      .click();
    const shelfInput = page.getByRole("textbox", {
      name: "Add a shelf to Living room",
    });
    await shelfInput.fill("Top shelf");
    await page.getByRole("button", { name: "Add shelf", exact: true }).click();
    await expect(
      page.getByRole("link", { name: "Top shelf", exact: true }),
    ).toBeVisible();
    await shelfInput.fill("Bottom shelf");
    await page.getByRole("button", { name: "Add shelf", exact: true }).click();
    await expect(
      page.getByRole("link", { name: "Bottom shelf", exact: true }),
    ).toBeVisible();
    expect(await shelfNames()).toEqual(["Top shelf", "Bottom shelf"]);

    // Rename the first shelf
    await page
      .getByRole("button", { name: "Actions for shelf Top shelf", exact: true })
      .click();
    await page.getByRole("button", { name: "Rename", exact: true }).click();
    await page.getByLabel("New name for shelf Top shelf").fill("Middle shelf");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("link", { name: "Middle shelf", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Top shelf", exact: true }),
    ).toHaveCount(0);
    expect(await shelfNames()).toEqual(["Middle shelf", "Bottom shelf"]);

    // Delete the second shelf
    await page
      .getByRole("button", {
        name: "Actions for shelf Bottom shelf",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: "Delete shelf “Bottom shelf”?",
    });
    await dialog.getByRole("button", { name: "Delete shelf" }).click();
    await expect(
      page.getByRole("link", { name: "Bottom shelf", exact: true }),
    ).toHaveCount(0);
    expect(await shelfNames()).toEqual(["Middle shelf"]);
  });
});
