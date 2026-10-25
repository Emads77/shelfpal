import { test, expect } from '@playwright/test';
import { accessToken, newLoggedInUser } from './helpers.js';
import { createBookcase, createCopy, fetchCopy, listCopies } from './api.js';

// Every test logs in a fresh user through the UI, and gets an API token for setup.
async function setUp(page, request) {
  const user = await newLoggedInUser(page, request);
  const token = await accessToken(request, user);
  return { user, token };
}

test.describe('US-04: add a book manually', () => {
  test('E2E-05 adds a book by hand and finds it in the collection', async ({ page, request }) => {
    const { token } = await setUp(page, request);

    await page.goto('/books/new');
    await page.getByLabel('Title', { exact: true }).fill('Manual Test Book');
    await page.getByLabel('Author', { exact: true }).fill('Test Author');
    await page.getByRole('button', { name: 'Add book', exact: true }).click();
    await expect(page).not.toHaveURL(/\/books\/new/);

    // Saved in the database, not only shown in the browser.
    const copies = await listCopies(request, token);
    expect(copies.map((c) => c.book.title)).toContain('Manual Test Book');

    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Manual Test Book', exact: true })).toBeVisible();
  });
});

test.describe('US-05: edit a book entry', () => {
  test('E2E-08 edits the title, and the change survives a reload', async ({ page, request }) => {
    const { token } = await setUp(page, request);
    const copy = await createCopy(request, token, { title: 'Old Title', author: 'Test Author' });

    await page.goto(`/books/${copy.id}/edit`);
    await expect(page.getByRole('heading', { name: 'Edit Book' })).toBeVisible();
    await page.getByLabel('Title', { exact: true }).fill('New Title');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'New Title' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'New Title' })).toBeVisible();

    const saved = await (await fetchCopy(request, token, copy.id)).json();
    expect(saved.book.title).toBe('New Title');
  });
});

test.describe('US-09: set the reading status', () => {
  test('E2E-10 changes the status, and it is still set after a reload', async ({ page, request }) => {
    const { token } = await setUp(page, request);
    const copy = await createCopy(request, token, { title: 'Status Book', author: 'Test Author' });

    await page.goto(`/books/${copy.id}`);
    await page.getByRole('button', { name: /change reading status of Status Book/ }).click();

    const patched = page.waitForResponse(
      (r) => r.url().includes(`/api/copies/${copy.id}/`) && r.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Reading', exact: true }).click();
    expect((await patched).status()).toBe(200);

    await page.reload();
    await expect(
      page.getByRole('button', { name: /^Reading, change reading status of Status Book/ }),
    ).toBeVisible();
  });
});

test.describe('US-06: remove a book', () => {
  test('E2E-11 deletes a book, and it is gone after a reload', async ({ page, request }) => {
    const { token } = await setUp(page, request);
    const copy = await createCopy(request, token, { title: 'Doomed Book', author: 'Test Author' });

    await page.goto(`/books/${copy.id}`);
    await page.getByRole('button', { name: 'Actions for Doomed Book' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('button', { name: 'Delete book' }).click();

    await expect(page).toHaveURL(/\/$/);
    expect((await fetchCopy(request, token, copy.id)).status()).toBe(404);

    await page.reload();
    await expect(page.getByText('Doomed Book', { exact: true })).toHaveCount(0);
  });
});

test.describe('US-07: search the collection', () => {
  test('E2E-12 finds a book by title and shows its shelf', async ({ page, request }) => {
    const { token } = await setUp(page, request);
    const bookcase = await createBookcase(request, token, 'Living room', ['Top shelf']);
    await createCopy(request, token, {
      title: 'Dune',
      author: 'Frank Herbert',
      shelf: bookcase.shelves[0].id,
    });
    await createCopy(request, token, { title: 'Emma', author: 'Jane Austen' });

    await page.goto('/');
    await page.getByLabel('Search your collection').fill('  DUNE ');

    await expect(page.getByText('Showing 1 of 2 books')).toBeAttached();
    await expect(page.getByRole('link', { name: 'Dune', exact: true })).toBeVisible();
    await expect(page.getByText('Emma', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Top shelf/ })).toBeVisible();
  });
});
