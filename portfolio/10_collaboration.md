# Show and tell: Collaboration

**Learning outcome:** You evaluate the performance of your group and its individual members in an open, honest, and
substantiated manner. **Rubric row:** Collaboration (5%)

## How the work was divided

| Area                          | Emad                                                                                                                                                                                                      | Andrea                                                                                                                                                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Research and MCAs             | Wrote all MCAs (database, backend framework, frontend)                                                                                                                                                    | Reviewed the MCAs                                                                                                                                                                                                        |
| Target audience survey        | Reviewed the survey                                                                                                                                                                                       | Made the survey and found collectors to fill it in                                                                                                                                                                       |
| Backend features              | Add a book manually (#53), scan and Open Library lookup (#51)                                                                                                                                             | Search (#62), extra copy details and detail page (MR !15), edit and reading status (MR !17), Login, Registration, Session, Bulk creation of shelves                                                                      |
| Frontend features             | Add book page, scan page                                                                                                                                                                                  | Search, book detail, status menu, edit page, book deletion, additional book info and shelves creation on scan/add pages, styling of most of the app. Login, registration pages, reworked bookcase pages, shelf list view |
| Security                      | Owner checks and 404 for foreign ids (#51, #53), delete rules and transactions, firewall and ports bound to 127.0.0.1 (#83), HTTPS, separate secrets per environment, audit request, technical design 7.5 | Security logging with request ids and error alerts (#63), input validation on copy details and the unique ISBN constraint (MR !15), reviews of the security work                                                         |
| Deployment pipeline and HTTPS | Images in CI (#71), server stack (#72), Caddy and firewall (#83), automated deploy (#85), seeding (#40)                                                                                                   | Monitoring config in the deploy, Faro build argument                                                                                                                                                                     |
| Update strategy               | Rolling backends (#70) and frontends (#86), version banner                                                                                                                                                | Drafted the initial strategy for frontend updates including update banner.                                                                                                                                               |
| Monitoring                    | Review                                                                                                                                                                                                    | Logging, Faro, Alloy, dashboard and alerts (#63), monitoring in the deploy (#87, #89)                                                                                                                                    |
| Offline                       | Read only PWA (#91)                                                                                                                                                                                       | Raised the PWA idea                                                                                                                                                                                                      |
| Tests                         | Vitest setup (#88), first component tests, end to end tests (#96), first version of the traceability matrix                                                                                               | Component tests CT-07 to CT-28 and matrix updates (#80), End to end tests 6-7,9,13,14,15 (#80) backend tests in his MRs, Manual tests                                                                                    |
| API documentation             |                                                                                                                                                                                                           | OpenAPI file and docs page                                                                                                                                                                                               |

Proof: GitLab issues, merge requests and commit history. Contributors
graph: https://gitlab.com/saxionnl/hbo-ict/aad/2026-2027/09/-/graphs/main

## What I understand of my partner's work

### Emad about Andrea's work

I followed Andrea's work through the board first: the issues told me what he was building and why. When he opened a
merge request, I studied the code before reviewing it, then ran it locally and clicked through the flow myself. That
review step is where I learned most about his part.

Two examples I can explain:

- **Request id (#63):** the browser sends no id. The middleware on the backend keeps a valid incoming id or creates a
  new one, logs one JSON line per request with that id, and sends it back in a response header. The frontend reads that
  header and adds the id to its own log line, which Faro sends to Grafana. Searching one id in Grafana shows both the
  browser side and the server side of the same action.
- **Copy on write (MR !17):** a Book holds the data from Open Library, a Copy holds what belongs to one user. When a
  user edits a field of a shared book, `update_copy` makes a private clone for that user, pointing back to the original.
  Later edits change the clone, other users keep the original, and nothing is cloned when the values didn't change.

### Andrea about Emad's work

Like Emad I reviewed merge requests for approval and tried to spot problems with them. We have very different working
times so collaboration in real time was not really possible but I always stayed in contact through Discord.
I have a good idea of the work he did to deploy the app and how the pipeline was setup. I had to observe and make a few
adjustments myself to make sure everything worked smoothly, particularly with the integration of the monitoring services
while deployed. I don't think specific examples are really necessary but I can name something the fact that we have
multiple instances of backend and frontend running at all times, this is done so that when we deploy updates we can
update one first then the other and avoid downtime by switching traffic between instances.

## Reflection

### Emad

- **My contribution:** The scanning flow with Open Library, adding books by hand, the full deployment setup (pipeline,
  server, HTTPS, rolling updates, seeding), the offline PWA, the test setup and the end to end tests.
- **What went well:** Communication. We talked about every issue before starting and reviewed every merge request before
  it went in, so neither of us merged code the other had not seen. The reviews caught real bugs, like a 500 on large
  edition numbers and a port that was open to the internet.
- **What did not go well:** Some merge requests grew beyond their story. MR !17 held two stories plus changes in files
  from other issues, which made reviewing slow and blocked other work while we waited. We also left the end to end tests
  until the end.
- **What I would do differently:** Agree on a scope rule at the start, one story per merge request, and write it in the
  README. And plan testing per story instead of at the end.
- **What I want to keep doing:** Testing my partner's work by hand during review, not only reading the code. It is the
  fastest way to understand what someone else built.

### Andrea

- **My contribution:** I have a hard time recalling every single thing at the moment, but the commits and issue board
  will speak for themselves. At the moment of writing this part I don't have a lot of time to go through all of them and
  make a detailed list, but I mentioned some contributions all over this document.
- **What went well:** We managed to keep the pace of the project overall well enough, we stuck to our agreement on how
  to work with branches and merge requests, this led to very little merge conflicts and an app that works well for the
  time we had to make it.
- **What did not go well:** We had some misunderstandings on functionality to implement, and we got stuck for a while on
  how to organize tasks. The huge amount of things to do and manage in this project also led to rushing things near the
  end, I am personally very unsure about the quality of this document for example, but I have no time to make big
  changes.
- **What I would do differently:** I would use the first weeks better to start organizing the structure of the final
  submission, things like getting these show and tell documents started with a skeleton and record time by time the
  tasks I did. Also other similar things to make sure that it's easier gather everything and submit in the end. I also
  would like to use Epics on the issue board to group smaller tasks under, and discuss in more detail what we should do
  for them.
- **What I want to keep doing:** I want to keep getting better at organizing the workload and learn more about in depth
  about the things that I had to get help from AI to do. I would like to keep improving this application because it's
  something I wanted to do for a while.

### Together

- **Keep:** reviewing every MR before merging, linking commits to issues.
- **Change:** Improve how the issue board is used, some stories had to be reworded or modified, some were duplicates of things already there.

## Use of generative AI

This table was drafted with Claude from our issue and MR history. The reflections are our own words.
