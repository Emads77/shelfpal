# ShelfPal test traceability matrix


## How to use

Every test gets one row. When a test is written and passes in CI, set its status to Done and fill in the file. This matrix is the evidence for "tests are related to the requirements" in both the FSD and RWA rubrics.

- **ID prefixes:** CT for component tests, API for backend tests, E2E for Playwright tests, MT for manual tests.
- **Status:** To do, In progress, Done or Blocked.
- **Naming:** every describe block starts with the story ID, for example `US-05: loading an existing book into the edit form`. Start each test name with its test ID, for example `CT-07 retries the request after a successful refresh`.
- **Component test files:** `frontend/src/test`, mirroring `src/features`. A test for `src/features/books/bookFields.js` goes in `src/test/books/bookFields.test.js`.
- **Playwright test files:** location decided when Playwright is set up.
- **Manual tests:** run on acceptance, on a phone and on a desktop. Record date, device, result and a screenshot in the test report.

## Scope

This round covers the main functionality only: US-01, US-02, US-03, US-04, US-05, US-06 and US-09.

| Story | Summary |
| --- | --- |
| US-01 | Register and log in |
| US-02 | Add a book by scanning its barcode |
| US-03 | Signed, numbered, bookcase and shelf fields |
| US-04 | Add a book manually |
| US-05 | Edit a book entry |
| US-06 | Remove a book |
| US-09 | Mark a book as read or unread |

Left out for now: US-07 search, US-08 suggestions, US-10 and US-11 offline. Add rows for any of these once they are built, since offline behaviour is graded in the FSD functionality row.

## Component tests (Vitest)

12 of 21 done. These run in the frontend test job on every pipeline, with the API mocked by MSW.

| ID | Story | What it checks | File | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| CT-01 | US-04, US-05 | validateBook requires title and author, and treats spaces as empty | src/test/books/bookFields.test.js |  | Done |
| CT-02 | US-04, US-05 | bookPayload trims every field | src/test/books/bookFields.test.js |  | Done |
| CT-03 | US-05 | bookFromCopy turns null optional fields into empty strings | src/test/books/bookFields.test.js |  | Done |
| CT-04 | US-03 | Bookcases page shows loading, then the empty state | src/test/bookcases/BookcasesPage.test.jsx |  | Done |
| CT-05 | US-03 | Add bookcase form opens from the empty state | src/test/bookcases/BookcasesPage.test.jsx |  | Done |
| CT-06 | US-03 | Load error shows an alert, and retry recovers | src/test/bookcases/BookcasesPage.test.jsx |  | Done |
| CT-07 | US-01 | client.js: a 401 triggers a token refresh and retries the request | src/test/api/client.test.js |  | Done |
| CT-08 | US-01 | client.js: a failed refresh clears tokens and calls the session expired handler | src/test/api/client.test.js |  | Done |
| CT-09 | US-01 | client.js: two parallel 401s trigger only one refresh | src/test/api/client.test.js |  | Done |
| CT-10 | US-01 | client.js: a network failure becomes ApiError with status 0 and a readable message | src/test/api/client.test.js |  | Done |
| CT-11 | US-01 | Login form shows the server error on wrong credentials | src/test/auth/LoginPage.test.jsx |  | Done |
| CT-12 | US-01 | Login form stores the tokens and navigates on success | src/test/auth/LoginPage.test.jsx |  | Done |
| CT-13 | US-09 | StatusMenu shows the current status and changes it with a PATCH | src/test/books/StatusMenu.test.jsx |  | To do |
| CT-14 | US-09 | A failed status change shows an error and keeps the old status | src/test/books/StatusMenu.test.jsx |  | To do |
| CT-15 | US-04 | Manual add: an empty submit shows title and author errors and sends no request | src/test/books/AddBookPage.test.jsx |  | To do |
| CT-16 | US-04 | Manual add: a valid submit sends the trimmed payload | src/test/books/AddBookPage.test.jsx |  | To do |
| CT-17 | US-02 | ISBN lookup fills the book fields | src/test/books/AddBookPage.test.jsx |  | To do |
| CT-18 | US-02 | A failed lookup shows a message, and manual entry still works | src/test/books/AddBookPage.test.jsx |  | To do |
| CT-19 | US-05 | Edit page loads the copy into the form | src/test/books/EditBookPage.test.jsx |  | To do |
| CT-20 | US-05 | Saving the edit form sends a PATCH and shows the updated book | src/test/books/EditBookPage.test.jsx |  | To do |
| CT-21 | US-06 | Delete asks for confirmation, and cancel keeps the book | src/test/books/BookDetailPage.test.jsx |  | To do |

File names for tests not written yet are suggestions. Match them to the real feature folder.

## Backend API tests (Django)

The backend already has passing tests in CI, but only these two are mapped to stories so far. Map the remaining existing tests to their stories as extra API rows.

| ID | Story | What it checks | File | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| API-01 | US-05 | Copy on write: an API book is cloned on the first book field edit, no clone when values are unchanged, other users keep the original | test\_copy\_update.py |  | Done |
| API-02 | US-09 | An anonymous PATCH on a copy's status is rejected | Not written yet |  | To do |

## End to end tests (Playwright)

0 of 11 done. All are blocked until Playwright runs in CI against a fresh stack with migrations and seed data. Each test creates its own user, so a run leaves no residue for the next one.

| ID | Story | What it checks | File | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| E2E-01 | US-01 | Log in and log out | e2e/auth.spec.js |  | Blocked |
| E2E-02 | US-01 | A wrong password shows an error and stays on the login page | e2e/auth.spec.js |  | Blocked |
| E2E-03 | US-01 | Anonymous API requests to copies are rejected (API test) | e2e/auth.spec.js |  | Blocked |
| E2E-04 | US-03 | Create a bookcase with shelves, rename it, delete it | e2e/bookcases.spec.js |  | Blocked |
| E2E-05 | US-04, US-03 | Add a book manually with shelf, signed and numbered, and find it on that shelf | e2e/books.spec.js |  | Blocked |
| E2E-06 | US-02 | Add a book by ISBN, with the external API stubbed | e2e/books.spec.js |  | Blocked |
| E2E-07 | US-02 | Add a book while the external API is down, falling back to manual entry | e2e/books.spec.js |  | Blocked |
| E2E-08 | US-05 | Edit a book and move it to another shelf | e2e/books.spec.js |  | Blocked |
| E2E-09 | US-05 | Copy on write: user A edits a catalogue book, user B still sees the original | e2e/books.spec.js |  | Blocked |
| E2E-10 | US-09 | Change the read status, and it is still set after a reload | e2e/books.spec.js |  | Blocked |
| E2E-11 | US-06 | Delete a book, and it is gone after a reload | e2e/books.spec.js |  | Blocked |

File names are suggestions until the Playwright setup is merged.

## Manual tests (acceptance)

0 of 5 done. These cover what automation can't: the real camera, real devices and keyboard only use. Each one gets its own test case with preconditions, steps and expected result, plus a dated entry in the test report.

| ID | Story | What it checks | Device | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| MT-01 | US-02 | Scan a real barcode with the camera, and the fields fill in | Phone |  | To do |
| MT-02 | US-01 | Log in with the same account on two devices and see the same collection | Phone and desktop |  | To do |
| MT-03 | US-03, US-05 | Move a book to another shelf on the phone, then find it there on desktop | Phone and desktop |  | To do |
| MT-04 | US-04 | Add a book manually using only the keyboard | Desktop |  | To do |
| MT-05 | US-09, US-06 | Change the status and delete a book on a small screen; menus fit and are easy to tap | Phone |  | To do |

MT-04 also serves as accessibility evidence for the FSD functionality row.

## Coverage per user story

Every story in scope has planned component, end to end and manual tests. The API column fills in once the existing backend tests are mapped.

| Story | Component | API | End to end | Manual |
| --- | --- | --- | --- | --- |
| US-01 | CT-07 to CT-12 |  | E2E-01, E2E-02, E2E-03 | MT-02 |
| US-02 | CT-17, CT-18 |  | E2E-06, E2E-07 | MT-01 |
| US-03 | CT-04, CT-05, CT-06 |  | E2E-04, E2E-05 | MT-03 |
| US-04 | CT-01, CT-02, CT-15, CT-16 |  | E2E-05 | MT-04 |
| US-05 | CT-01, CT-02, CT-03, CT-19, CT-20 | API-01 | E2E-08, E2E-09 | MT-03 |
| US-06 | CT-21 |  | E2E-11 | MT-05 |
| US-09 | CT-13, CT-14 | API-02 | E2E-10 | MT-05 |
