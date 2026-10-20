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

Backend: docker compose exec backend python manage.py test
Frontend tests follow later.

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
ruff check .
ruff format .

Frontend (from /frontend):
npx oxlint
npx prettier --write .

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
