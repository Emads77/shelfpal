# ShelfPal: Library Management App

Catalogues physical books and tracks their location on your shelves.

Stack: React, Django + Django REST Framework, PostgreSQL, Docker.

## Prerequisites

- Python 3.12+
- Docker and Docker Compose

## Setup Frontend

1. cd frontend
2. npm install
3. npm run dev

## Run the backend with Docker

From the repository root:

1. Copy .env.example to .env and fill in SECRET_KEY. Set DEBUG=True for local use.
2. Start the database and the backend:
   docker compose up -d --build
3. Apply the migrations and create an admin user:
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py createsuperuser

The API runs at http://localhost:8000/api/ and the admin at http://localhost:8000/admin/.

Stop with docker compose down. Add -v to also delete the database.

## Run the backend without Docker (optional)

From the repository root:

1. Start only the database:
   docker compose up -d postgres
2. Create and activate a virtual environment:
   python -m venv venv
   source venv/bin/activate (Windows: venv\Scripts\activate)
3. Install the packages and start the server:
   pip install -r backend/requirements.txt
   cd backend
   python manage.py migrate
   python manage.py runserver

Keep POSTGRES_HOST=localhost in .env. Stop the backend container first, since both use port 8000.

## Tests

### Backend tests

The backend uses Django's built in test runner. Tests need a running Postgres, so run them inside the backend container:

    docker compose exec backend python manage.py test

Run the tests of one app only, for example accounts:

    docker compose exec backend python manage.py test accounts

Django creates a separate test database for every run and deletes it afterwards, so your development data is never touched.

In CI the backend test job runs on python:3.12 with a postgres:17 service. The database credentials in that job are throwaway values, and SECRET_KEY comes from a GitLab CI/CD variable.

### Frontend tests

The frontend uses Vitest with Testing Library for component tests and MSW to mock the API at the network level.

Run all tests once from the frontend folder:

    npm test

Run in watch mode while developing:

    npm run test:watch

Tests live in src/test, mirroring the structure of src/features. A test for src/features/books/bookFields.js goes in src/test/books/bookFields.test.js. Every describe block starts with the user story ID it covers, for example US-05.

src/test/setup.js starts the MSW server before the tests. Any API call a test does not mock makes the test fail, so add a handler with server.use for every endpoint the component calls.

### In the pipeline

Both test jobs run in the CI test stage on every pipeline, in parallel. A failing test in either one stops build and deploy.

## Git process

We use two long living branches. Dev is tested and deployed to acceptance. Main is production.
Both are protected, every change goes through a merge request.

1. Pick an issue from the board.
2. In the issue, click the arrow next to "Create merge request" and choose "Create branch" (source: dev).
3. Get the branch locally:
   git fetch origin
   git checkout <branch name>
4. Commit with a short description and the issue number at the end:
   git commit -m "Add shelf model #29"
5. Before opening the merge request, update your branch with dev:
   git fetch origin
   git merge origin/dev
6. Push and open a merge request to dev. The other team member reviews it before merging.
7. After merging, the branch is deleted automatically and the issue is closed.
8. Once dev is tested on acceptance, dev is merged into main through a merge request, which releases to production.

## Code quality

Run these before opening a merge request.

Backend (from /backend, venv active):

```bash
ruff check .
```

```bash
ruff format .
```

Frontend (from /frontend):

```bash
npx oxlint
```

```bash
npx prettier --write .
```

Setup details and reasoning: see section 10 of the technical design.

## Description

Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Usage

Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Authors and acknowledgment

Show your appreciation to those who have contributed to the project.

## License

For open source projects, say how it is licensed.

## Project status

If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
