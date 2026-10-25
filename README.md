# ShelfPal

ShelfPal is a catalogue for book collectors. It replaces the spreadsheet: you add books by scanning their barcode or by hand, place each copy on a bookcase and shelf that mirror your real shelves, and find any book again later.

| | |
| --- | --- |
| **Production** | https://shelfpal.saxion.college |
| **Acceptance** | https://acc.shelfpal.saxion.college |
| **Repository** | https://gitlab.com/saxionnl/hbo-ict/aad/2026-2027/09 |
| **Issue board** | https://gitlab.com/saxionnl/hbo-ict/aad/2026-2027/09/-/boards/11581276 |

**Stack:** React with Vite, Django with Django REST Framework, PostgreSQL, Docker. Book details come from the Open Library API. Monitoring runs on Grafana Cloud.

## Features

* Register and log in (JWT)
* Add a book by scanning its barcode with the camera, or by typing the ISBN; details are fetched from Open Library
* Add a book by hand when it has no ISBN
* Bookcases and shelves: create, rename, delete
* Edit a book; editing a shared catalogue book creates a private version for you only
* Move a book to another shelf, delete it
* Reading status: unread, reading or finished
* Search the collection by title or author and see which shelf a book is on
* Works offline in read only mode and can be installed as an app (PWA)

## Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| Docker with Docker Compose | recent | Running the whole stack |
| Node.js | 22 | Frontend development and tests |
| Python | 3.12 | Only when running the backend outside Docker |
| Git | any | |

On Windows, set `git config core.ignorecase false` after cloning. Windows ignores letter case in file names, the Linux CI runner does not, so a wrong case breaks the build in CI only.

## Run the app locally

From the repository root:

1. Copy the settings file:

   ```bash
   cp .env.example .env
   ```

   Fill in `SECRET_KEY` (any long random string) and set `DEBUG=True`. Add `SEED_USER_PASSWORD=` with a password of your choice if you want the sample users below.

2. Start the database, backend and frontend:

   ```bash
   docker compose up -d --build
   ```

3. Create the tables, then load the sample data:

   ```bash
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py seed
   ```

4. Open the app at **http://localhost:8080**.

| Address | What |
| --- | --- |
| http://localhost:8080 | The app (built frontend served by nginx, which forwards `/api/` to the backend) |
| http://localhost:8000/api/ | The API directly |
| http://localhost:8000/admin/ | Django admin |

For the admin, create a superuser:

```bash
docker compose exec backend python manage.py createsuperuser
```

Stop with `docker compose down`. Add `-v` to also delete the database.

### Sample credentials

The seed command creates two users with bookcases, shelves and books in every reading status:

| Email | Password |
| --- | --- |
| collector@shelfpal.test | the value of `SEED_USER_PASSWORD` in your `.env` |
| reader@shelfpal.test | the value of `SEED_USER_PASSWORD` in your `.env` |

The seed command is safe to run more than once. It refuses to run when `DEPLOY_ENV=production` or when `SEED_USER_PASSWORD` is missing, so test users never reach production. On acceptance it runs automatically on every deploy, with the password from the acceptance configuration.

### Frontend with hot reload

For frontend work, run the Vite dev server instead of the built frontend:

```bash
cd frontend
npm install
npm run dev
```

It talks to the backend on http://localhost:8000. The dev server has no service worker, so test offline behaviour through http://localhost:8080 instead.

### Backend without Docker (optional)

1. Start only the database: `docker compose up -d postgres`
2. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate        # Windows: venv\Scripts\activate
   ```

3. Install and run:

   ```bash
   pip install -r backend/requirements.txt
   cd backend
   python manage.py migrate
   python manage.py runserver
   ```

Keep `POSTGRES_HOST=localhost` in `.env`, and stop the backend container first, since both use port 8000.

### Monitoring (optional)

The Grafana Alloy container that ships logs to Grafana Cloud is in a separate compose profile. Locally it only starts when you ask for it, and it needs the `GRAFANA_LOKI_*` settings in `.env`:

```bash
docker compose --profile monitoring up -d
```

## Tests

### Backend tests

Django's test runner, inside the backend container, because the tests need PostgreSQL:

```bash
docker compose exec backend python manage.py test
docker compose exec backend python manage.py test library    # one app only
```

Django creates a separate test database for every run and deletes it afterwards, so your development data is never touched. Calls to Open Library are mocked, so the tests never depend on an outside service.

### Frontend component tests

Vitest with Testing Library, with the API mocked at network level by MSW. From `frontend`:

```bash
npm test               # run once
npm run test:watch     # rerun on every change
```

Tests live in `src/test`, mirroring `src/features`: a test for `src/features/books/bookFields.js` goes in `src/test/books/bookFields.test.js`. Every describe block starts with the user story it covers, for example `US-05`. Any API call a test does not mock makes it fail, so add a handler with `server.use` for every endpoint the component calls.

### End to end tests

Playwright, against the running stack. Start the stack first, then from `frontend`:

```bash
npx playwright install chromium     # first time only
npx playwright test
npx playwright show-report          # open the HTML report
```

The tests run against http://localhost:8080 by default. Set `E2E_BASE_URL` to test another environment. Every test registers its own user with a unique email, so tests are independent, can run in any order and leave nothing that affects the next run. Test files live in `frontend/e2e`.

### Traceability

Every test is linked to a user story in [docs/testing/traceability-matrix.md](docs/testing/traceability-matrix.md). Update the matrix in the same merge request as the tests it describes.

## API documentation

The API is described in OpenAPI format, generated from the code:

* [docs/openapi.yaml](docs/openapi.yaml): the specification
* [docs/api-docs.html](docs/api-docs.html): the same, as a readable page

All endpoints except register, login and token refresh require a JWT access token in the `Authorization: Bearer` header.

## Pipeline and deployment

The GitLab pipeline has five stages: lint, test, build, deploy and e2e.

| Event | Lint and tests | Build images | Deploy |
| --- | --- | --- | --- |
| Push to a feature branch | yes | no | no |
| Merge into dev | yes | yes | to acceptance automatically, then end to end tests |
| Merge into main | yes | yes | to production after a manual click, using the image acceptance tested |

Rules that keep this working:

* Always merge dev into main with a **merge commit**, never squash or fast forward. Production finds the tested image through the second parent of that merge commit.
* Only start the production deploy when the end to end tests on dev are green.
* Deploys are rolling: two backends and two frontends per environment, replaced one at a time, so users see no downtime. Migrations run automatically before the new version starts, so every migration must work with the previous version of the code. See chapter 13 of the technical design.

Server configuration and secrets live in protected GitLab CI/CD variables (`ENV_FILE`, one per environment), never in the repository. [deploy/.env.server.example](deploy/.env.server.example) lists every setting with the secrets left empty.

## Working on the project

### Git process

Two long living branches: **dev** is tested and deployed to acceptance, **main** is production. Both are protected; every change goes through a merge request.

1. Pick an issue from the [board](https://gitlab.com/saxionnl/hbo-ict/aad/2026-2027/09/-/boards/11581276).
2. In the issue, click the arrow next to "Create merge request" and choose "Create branch", with dev as source.
3. Get the branch locally:

   ```bash
   git fetch origin
   git checkout <branch name>
   ```

4. Commit with a short description and the issue number at the end:

   ```bash
   git commit -m "Add shelf model #29"
   ```

5. Before opening the merge request, bring your branch up to date with dev and solve any conflicts on your branch:

   ```bash
   git fetch origin
   git merge origin/dev
   ```

6. Push and open a merge request to dev. The other team member reviews it before merging. Approving is not the same as merging: someone still has to click Merge.
7. After merging, the branch is deleted and the issue is closed.

### Team agreements

* **One story per merge request.** Changes outside the issue's scope get their own issue, so reviews stay small.
* **Do not change someone else's files outside your issue** without discussing it first.
* **Tests come with the code.** A new feature includes its tests and an update of the traceability matrix in the same merge request.
* **Never commit secrets.** `.env` files are ignored by git; only the example files are committed.

### Code quality

Formatting and linting are checked in the pipeline, and a failing check blocks the merge. Run them before pushing.

Backend, from `backend`:

```bash
ruff check .
ruff format .
```

Frontend, from `frontend`:

```bash
npx oxlint
npx prettier --write .
```

EditorConfig keeps indentation and line endings the same in every file. The reasoning behind these choices is in section 11.2 of the technical design.

### AI usage policy

We use generative AI (Claude) to explain new concepts, help with debugging, review merge requests, and draft code, tests and documentation. To make sure the result is correct:

* **You own what you commit.** Never commit generated code you cannot explain line by line.
* **Generated code gets the same checks as our own:** it must pass linting and all tests in the pipeline, and be reviewed by the other team member in a merge request.
* **Run it before you trust it.** Generated code is tested locally first, and every behaviour it adds gets a test.
* **No secrets in prompts.** Never paste passwords, tokens or `.env` contents into an AI tool.
* **Be transparent.** Every document says what AI was used for, in its GenAI disclosure.

## Documentation

* Technical design: architecture, C4 diagrams, data model, security, offline design, testing and deployment
* MCAs for the backend, database and frontend, with a summary document
* [docs/testing/traceability-matrix.md](docs/testing/traceability-matrix.md): tests per user story
* [docs/portfolio/](docs/portfolio/): RWA show and tell documents

## Authors

Emad Sawan and Andrea Tolu, Saxion University of Applied Sciences, Advanced Application Development 2026 to 2027, group 05.

## Project status

Built for the Full Stack Development and Real World Applications courses, and continued in the second quartile. Planned next: nightly database backups, a scheduled cleanup of expired login tokens, and the reading suggestions picker, additional details in the book information.
