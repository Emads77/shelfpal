# Show and tell: Security and data integrity

**Learning outcome:** You demonstrate how the security and integrity of your application's data is safeguarded by identifying risks and following security best practices.
**Rubric row:** Security and data integrity (15%)
**Main work by:** [TO FILL]

## What we built

Users log in with JWT through Django REST Framework and SimpleJWT. Every query for bookcases, shelves and copies is filtered on the owner, and another user's data returns 404 so ids cannot be probed. Input is validated in serializers and the database, writes that touch several rows run in one transaction, and the server only exposes ports 22, 80 and 443.

## Proof

| What | Where to see it |
| --- | --- |
| OWASP Top 10 table with measure and test per risk | Technical design, chapter 7 |
| STRIDE per component | Technical design, chapter 7 |
| Deployment and infrastructure security | Technical design, 7.5 |
| Ownership tests (another user gets 404) | `backend/library/tests/`: `test_bookcases.py`, `test_shelves.py`, `test_copies.py`, `test_copy_detail_view.py`, `test_copy_details.py`, `test_copy_update.py`, `test_add_book.py`, `test_add_scanned_book.py`, `test_overview.py` |
| Anonymous requests rejected | E2E-03 in `frontend/e2e/auth.spec.js` |
| Firewall rules | `deploy/firewall.sh` |
| External audit | [TO FILL: report, team, date] |

## What the assessor looks at

| Assessor looks at | Our answer | Proof |
| --- | --- | --- |
| IAM | JWT with a short lived access token in memory and a refresh token in localStorage. Refresh tokens are blacklisted on logout. Login shows one fixed message, so it never reveals which field was wrong. | Technical design 7.1, `LoginPage.jsx` |
| Relevant OWASP risks | Broken access control: owner filters, 404 for foreign ids. Injection: Django ORM only. Security misconfiguration: secrets per environment, DEBUG off, ports bound to 127.0.0.1. [TO FILL: the rest from the 7.x table] | Technical design 7.2 |
| Data integrity | Validation in serializers (for example edition number at most edition size, max 999999), constraints in the database (unique shared ISBN), RESTRICT and CASCADE rules for deletes, `transaction.atomic()` around multi row writes, copy on write for shared books. | Technical design 7.3 and 5.3 |
| Security throughout the process | Every MR review checked ownership and input; examples: a 500 on huge numbers became a 400, the Alloy port was closed to the internet, manual books were scoped by owner. | MR !15 review, MR #63 review |
| Testing our own measures | [TO FILL: self test results, the external audit outcome] | Audit report |

## Link to requirements

Confidentiality QR (respondents did not want others to see how valuable their collection is), US-01.

## Decisions and trade offs

* **Refresh token in localStorage:** simple and survives a reload, which the offline PWA needs. Trade off: readable by any script on the page if we ever had an XSS hole.
* **404 instead of 403 for foreign ids:** hides whether an id exists. Trade off: harder to debug.
* **Known limitations:** the pipeline logs in to the server as root, and Alloy mounts the Docker socket, which gives it control over all containers. Both are written down in 7.5.

## Problems we ran into

* **Docker published ports bypass ufw:** we found that a published port is open to the internet even with the firewall on. Binding to 127.0.0.1 is what really protects the containers.
* **Edition numbers above the column limit gave a 500:** found in review, fixed with a limit and a test.

## What we learned

### Emad

* **Could not do at the start, can do now:** [TO FILL]
* **Would do differently next time:** [TO FILL]
* **Already knew before this course:** [TO FILL]

### Andrea

* **Could not do at the start, can do now:** [TO FILL]
* **Would do differently next time:** [TO FILL]
* **Already knew before this course:** [TO FILL]

## Use of generative AI

Claude helped structure the OWASP and STRIDE tables and reviewed merge requests for access control issues. This document was drafted with Claude from our own project notes and checked by us.
