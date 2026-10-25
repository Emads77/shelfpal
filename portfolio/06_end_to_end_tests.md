# Show and tell: End to end tests

**Learning outcome:** You ensure your application's functionality with automated end to end tests.
**Rubric row:** Application tests (15%)
**Main work by:** Emad (Vitest setup #88, Playwright end to end tests #96), Andrea (component tests CT-07 to CT-28 and matrix updates, #80, Manual tests with report, some of the end to end tests)

## What we built

Ten Playwright tests drive the real app in a browser: login and logout, wrong password, anonymous API access, creating a bookcase, adding, editing, deleting and searching books, and changing the reading status. They run after every deploy to acceptance. Below them sit 28 component tests (Vitest) and the backend tests (Django), which run before anything is built.

## Proof

| What                                   | Where to see it                                  |
|----------------------------------------|--------------------------------------------------|
| End to end tests                       | `frontend/e2e/*.spec.js`                         |
| Test helpers (unique user, API setup)  | `frontend/e2e/helpers.js`, `frontend/e2e/api.js` |
| Pipeline job                           | `e2e-acceptance` in `.gitlab-ci.yml`             |
| Traceability matrix                    | `docs/testing/traceability-matrix.md`            |
| Screenshot: green `e2e-acceptance` job | `06_end_to_end_tests_jod_succeed.png`            |
| Manual test report                     | `ManualTestsReport-Group5.pdf`                   |

## What the assessor looks at

| Assessor looks at                            | Our answer                                                                                                                                                                                                                           | Proof              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| Which flows, and are they the important ones | Every core story has at least one test: log in (US-01), bookcases (US-03), add (US-04), edit (US-05), delete (US-06), search (US-07), reading status (US-09). Not covered yet: scanning (US-02) and copy on write between two users. | Matrix             |
| Repeatable, no residue                       | Each test registers its own user with a unique email, so tests never share data and can run in any order. We ran the suite twice in a row with the same result. Test users stay on acceptance but never affect the next run.         | Report screenshots |
| Runs automatically                           | After every deploy to acceptance. Production is only deployed by hand after that job is green.                                                                                                                                       | Pipeline           |
| Was it painful                               | Yes, see Problems below.                                                                                                                                                                                                             |                    |
| Relation to requirements                     | Every test name starts with its id, every describe block with its user story. The matrix maps stories to component, API, end to end and manual tests.                                                                                | Matrix             |

## Decisions and trade offs

- **Setup through the API, the action through the UI:** a test about deleting doesn't need to click through adding first. Faster and less fragile. Each test also checks the result in the database through the API, not only on screen.
- **Run against acceptance instead of a throwaway stack in CI:** about twenty lines instead of Docker in Docker. Trade off: a failing test finds the bug after it reached acceptance, not before.
- **No retries:** a flaky test should fail visibly.

## Problems we ran into

- **Strict locators:** the book card shows each title twice (text and link), so `getByText` found two elements. We switched to `getByRole('link')`, which is also what a user clicks.
- **Hidden menus:** logout sits inside the account menu. The test found it through the visually hidden "Account menu" label, which also proved that label works for screen readers.
- **File name casing:** Windows ignores case, the Linux CI runner does not.

## What we learned

### Emad

- **Could not do at the start, can do now:** Before this I didn't really know what separates an end to end test from the component tests we already had. Now I do: a component test fakes the backend, so it can never prove that a change is actually saved in the database. An end to end test runs everything for real, and a simple reload after the action is what proves it. I learned to write Playwright tests that find elements the way a user does, by role and label, to give every test its own user so runs never affect each other, and to create test data through the API so each test only clicks through the action it is about.

- **Would do differently next time:** Write the end to end test for a story as soon as the story is done, instead of all of them at the end. which left no time for the scanning flow or for running them against a fresh stack before the deploy.

- **Already knew before this course:** Writing unit tests for backend code.

### Andrea

- **Could not do at the start, can do now:** I know more libraries for component tests and end to end tests that I had never used before. The whole process of testing an entire application is general is a lot clearer to me now.
- **Would do differently next time:** Definitely implement more types of tests earlier in the process
- **Already knew before this course:** I mostly only did unit tests and manual tests before

## Use of generative AI

This document was drafted with Claude from our own project notes and checked by us. AI helped with generating the tests and setting up the environment to run them. 
