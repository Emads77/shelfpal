import { test, expect } from "@playwright/test";
import {
  accessToken,
  catalogueBook,
  loginViaUI,
  newLoggedInUser,
  registerUser,
} from "./helpers.js";
import {
  addCopyFromBook,
  createBookcase,
  createCopy,
  fetchCopy,
  listCopies,
} from "./api.js";

// Every test logs in a fresh user through the UI, and gets an API token for setup.
async function setUp(page, request) {
  const user = await newLoggedInUser(page, request);
  const token = await accessToken(request, user);
  return { user, token };
}

test.describe("US-02: add a book by ISBN", () => {
  test("E2E-06 looks up an ISBN and adds the found book", async ({
    page,
    request,
  }) => {
    const { token } = await setUp(page, request);
    // The lookup is stubbed in the browser, so OpenLibrary is never called.
    // It answers with a book that really exists, so adding it is a real request.
    const existing = await createCopy(request, token, {
      title: "Stubbed Lookup Book",
      author: "Test Author",
    });
    const lookedUp = [];
    await page.route("**/api/books/lookup/**", (route) => {
      lookedUp.push(new URL(route.request().url()).searchParams.get("isbn"));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: existing.book.id,
          isbn: "9780306406157",
          title: "Stubbed Lookup Book",
          author: "Test Author",
          publisher: "",
          cover: "",
        }),
      });
    });

    await page.goto("/books/scan");
    await page.getByLabel("Or type the ISBN").fill("9780306406157");
    await page.getByRole("button", { name: "Look up" }).click();

    const found = page.getByRole("region", { name: "Book found" });
    await expect(found).toContainText("Stubbed Lookup Book");
    expect(lookedUp).toEqual(["9780306406157"]);

    await page.getByRole("button", { name: "Add to my collection" }).click();
    await expect(page).not.toHaveURL(/\/books\/scan/);

    // Saved in the database: a second copy of the same book
    const copies = await listCopies(request, token);
    expect(copies.filter((c) => c.book.id === existing.book.id)).toHaveLength(
      2,
    );
  });

  test("E2E-07 shows a message when the lookup is unavailable, and manual entry works", async ({
    page,
    request,
  }) => {
    const { token } = await setUp(page, request);
    await page.route("**/api/books/lookup/**", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Book lookup is unavailable right now." }),
      }),
    );

    await page.goto("/books/scan");
    await page.getByLabel("Or type the ISBN").fill("9780306406157");
    await page.getByRole("button", { name: "Look up" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "We couldn't look up this book right now.",
    );

    // The link to manual entry works, and the book can be added by hand
    await page
      .getByRole("link", { name: "Enter a book by hand instead" })
      .click();
    await expect(page).toHaveURL(/\/books\/new$/);
    await page.getByLabel("Title", { exact: true }).fill("Entered By Hand");
    await page.getByLabel("Author", { exact: true }).fill("Test Author");
    await page.getByRole("button", { name: "Add book", exact: true }).click();
    await expect(page).not.toHaveURL(/\/books\/new/);

    const copies = await listCopies(request, token);
    expect(copies.map((c) => c.book.title)).toContain("Entered By Hand");
  });
});

test.describe("US-04: add a book manually", () => {
  test("E2E-05 adds a book by hand and finds it in the collection", async ({
    page,
    request,
  }) => {
    const { token } = await setUp(page, request);

    await page.goto("/books/new");
    await page.getByLabel("Title", { exact: true }).fill("Manual Test Book");
    await page.getByLabel("Author", { exact: true }).fill("Test Author");
    await page.getByRole("button", { name: "Add book", exact: true }).click();
    await expect(page).not.toHaveURL(/\/books\/new/);

    // Saved in the database, not only shown in the browser.
    const copies = await listCopies(request, token);
    expect(copies.map((c) => c.book.title)).toContain("Manual Test Book");

    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Manual Test Book", exact: true }),
    ).toBeVisible();
  });

  test("E2E-14 adds a signed and numbered book to a shelf and finds it there", async ({
    page,
    request,
  }) => {
    const { token } = await setUp(page, request);
    const bookcase = await createBookcase(request, token, "Living room", [
      "Top shelf",
    ]);
    const shelf = bookcase.shelves[0];

    await page.goto("/books/new");
    await page.getByLabel("Title", { exact: true }).fill("Signed Test Book");
    await page.getByLabel("Author", { exact: true }).fill("Test Author");
    await page
      .getByLabel("Shelf", { exact: true })
      .selectOption({ label: "Top shelf" });

    // The edition details are folded away until opened
    await page.getByText("Edition details (optional)").click();
    await page.getByLabel("Signed", { exact: true }).check();
    await page.getByLabel("Numbered", { exact: true }).check();
    await page.getByLabel("Your number").fill("7");
    await page.getByLabel("Out of").fill("100");
    await page.getByRole("button", { name: "Add book", exact: true }).click();

    // The app opens the shelf the book was put on
    await expect(page).toHaveURL(
      new RegExp(`/bookcases/${bookcase.id}/shelves/${shelf.id}$`),
    );
    const bookLink = page.getByRole("link", {
      name: "Signed Test Book",
      exact: true,
    });
    await expect(bookLink).toBeVisible();

    // Saved in the database with the shelf and the edition details
    const copies = await listCopies(request, token);
    expect(copies).toHaveLength(1);
    expect(copies[0].book.title).toBe("Signed Test Book");
    expect(copies[0]).toMatchObject({
      shelf: shelf.id,
      is_signed: true,
      edition_number: 7,
      edition_size: 100,
    });

    // The detail page shows both details
    await bookLink.click();
    await expect(page.getByText("Signed", { exact: true })).toBeVisible();
    await expect(page.getByText("Numbered 7 / 100")).toBeVisible();
  });
});

test.describe("US-05: edit a book entry", () => {
  test("E2E-08 edits the title, and the change survives a reload", async ({
    page,
    request,
  }) => {
    const { token } = await setUp(page, request);
    const copy = await createCopy(request, token, {
      title: "Old Title",
      author: "Test Author",
    });

    await page.goto(`/books/${copy.id}/edit`);
    await expect(
      page.getByRole("heading", { name: "Edit Book" }),
    ).toBeVisible();
    await page.getByLabel("Title", { exact: true }).fill("New Title");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "New Title" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "New Title" }),
    ).toBeVisible();

    const saved = await (await fetchCopy(request, token, copy.id)).json();
    expect(saved.book.title).toBe("New Title");
  });

  test("E2E-09 copy on write: an edit by user A leaves the original for user B", async ({
    page,
    request,
    browser,
    baseURL,
  }) => {
    const userA = await newLoggedInUser(page, request);
    const tokenA = await accessToken(request, userA);
    const userB = await registerUser(request);
    const tokenB = await accessToken(request, userB);

    // A catalogue book that both users have in their collection
    const catalogueBookData = await catalogueBook(request);
    const copyA = await addCopyFromBook(request, tokenA, catalogueBookData.id);
    const copyB = await addCopyFromBook(request, tokenB, catalogueBookData.id);

    // User A edits the title through the UI
    await page.goto(`/books/${copyA.id}/edit`);
    await page
      .getByLabel("Title", { exact: true })
      .fill("My Annotated Edition");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "My Annotated Edition" }),
    ).toBeVisible();

    // A has a personal version, and the catalogue book is untouched
    const savedA = await (await fetchCopy(request, tokenA, copyA.id)).json();
    expect(savedA.book.title).toBe("My Annotated Edition");
    expect(savedA.book.id).not.toBe(catalogueBookData.id);
    const savedB = await (await fetchCopy(request, tokenB, copyB.id)).json();
    expect(savedB.book.title).toBe(catalogueBookData.title);
    expect(savedB.book.id).toBe(catalogueBookData.id);

    // B still sees the original in the app
    const contextB = await browser.newContext({ baseURL });
    const pageB = await contextB.newPage();
    await loginViaUI(pageB, userB);
    await pageB.goto(`/books/${copyB.id}`);
    await expect(
      pageB.getByRole("heading", { level: 1, name: catalogueBookData.title }),
    ).toBeVisible();
    await contextB.close();
  });

  test("E2E-15 moves a book to another shelf", async ({ page, request }) => {
    const { token } = await setUp(page, request);
    const bookcase = await createBookcase(request, token, "Living room", [
      "Top shelf",
      "Bottom shelf",
    ]);
    const [topShelf, bottomShelf] = bookcase.shelves;
    const copy = await createCopy(request, token, {
      title: "Moving Book",
      author: "Test Author",
      shelf: topShelf.id,
    });

    await page.goto(`/books/${copy.id}`);
    await expect(
      page.getByRole("link", { name: "Living room · Top shelf" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Actions for Moving Book" }).click();
    await page.getByRole("button", { name: "Move to...", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Move 1 book" });
    await dialog.getByLabel("Move to").selectOption({ label: "Bottom shelf" });
    await dialog.getByRole("button", { name: "Move", exact: true }).click();

    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("link", { name: "Living room · Bottom shelf" }),
    ).toBeVisible();

    // Saved in the database, not only shown in the browser
    const saved = await (await fetchCopy(request, token, copy.id)).json();
    expect(saved.shelf).toBe(bottomShelf.id);
    expect(saved.location.shelf_name).toBe("Bottom shelf");
  });
});

test.describe("US-09: set the reading status", () => {
  test("E2E-10 changes the status, and it is still set after a reload", async ({
    page,
    request,
  }) => {
    const { token } = await setUp(page, request);
    const copy = await createCopy(request, token, {
      title: "Status Book",
      author: "Test Author",
    });

    await page.goto(`/books/${copy.id}`);
    await page
      .getByRole("button", { name: /change reading status of Status Book/ })
      .click();

    const patched = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/copies/${copy.id}/`) &&
        r.request().method() === "PATCH",
    );
    await page.getByRole("button", { name: "Reading", exact: true }).click();
    expect((await patched).status()).toBe(200);

    await page.reload();
    await expect(
      page.getByRole("button", {
        name: /^Reading, change reading status of Status Book/,
      }),
    ).toBeVisible();
  });
});

test.describe("US-06: remove a book", () => {
  test("E2E-11 deletes a book, and it is gone after a reload", async ({
    page,
    request,
  }) => {
    const { token } = await setUp(page, request);
    const copy = await createCopy(request, token, {
      title: "Doomed Book",
      author: "Test Author",
    });

    await page.goto(`/books/${copy.id}`);
    await page.getByRole("button", { name: "Actions for Doomed Book" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Delete book" }).click();

    await expect(page).toHaveURL(/\/$/);
    expect((await fetchCopy(request, token, copy.id)).status()).toBe(404);

    await page.reload();
    await expect(page.getByText("Doomed Book", { exact: true })).toHaveCount(0);
  });
});

test.describe("US-07: search the collection", () => {
  test("E2E-12 finds a book by title and shows its shelf", async ({
    page,
    request,
  }) => {
    const { token } = await setUp(page, request);
    const bookcase = await createBookcase(request, token, "Living room", [
      "Top shelf",
    ]);
    await createCopy(request, token, {
      title: "Dune",
      author: "Frank Herbert",
      shelf: bookcase.shelves[0].id,
    });
    await createCopy(request, token, { title: "Emma", author: "Jane Austen" });

    await page.goto("/");
    await page.getByLabel("Search your collection").fill("  DUNE ");

    await expect(page.getByText("Showing 1 of 2 books")).toBeAttached();
    await expect(
      page.getByRole("link", { name: "Dune", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Emma", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Top shelf/ })).toBeVisible();
  });
});
