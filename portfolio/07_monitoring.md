# Show and tell: Monitoring

**Learning outcome:** You monitor the stability of your application in production using a monitoring system.
**Rubric row:** Monitoring (15%)
**Main work by:** Andrea (#63 observability, #87 and #89 deploy and Alloy labels) 

## What we built

The backend writes one JSON log line per request, with a request id that the browser also logs, so one action can be followed from browser to database. Grafana Alloy runs on the server, reads the container logs and ships them to Grafana Cloud (Loki). The frontend sends its own logs and errors with Grafana Faro. A dashboard and alert rules sit in Grafana Cloud, and `/api/health/` reports whether a backend can reach the database.

## Proof

| What | Where to see it |
| --- | --- |
| Request logging and request id | `backend/config/middleware.py`, `backend/config/log_utils.py` |
| Health endpoint | `/api/health/`, `backend/config/views.py` |
| Frontend logging | `frontend/src/shared/logger.js`, `frontend/src/shared/faro.js` |
| Log shipping | `monitoring/config.alloy` |
| Dashboard and alert exports | `monitoring/shelfpal-dashboard.json`, `monitoring/backend-alert-rules.yaml` |
| Screenshot: dashboard | [TO FILL] |
| Screenshot: logs filtered by level and by request id | [TO FILL] |
| Screenshot: an alert that fired, and the notification | [TO FILL] |

## What the assessor looks at

| Assessor looks at | Our answer | Proof |
| --- | --- | --- |
| What it covers | Errors (5xx), response times, request volume, failed logins, frontend errors, backend health. No resource usage or uptime check yet. | Dashboard |
| Frontend logging | Yes, Faro sends browser logs and uncaught errors directly to Grafana Cloud. | `faro.js` |
| What the dashboard shows | "ShelfPal Monitoring" has six panels: backend logs (filter by environment, level and request id), requests, error rate in %, latency (p95 and p50), responses by status, and the top 5 endpoints. | Screenshot |
| Problems detected automatically | Error spikes, slow responses and login guessing. No downtime check on `/api/health/` yet. | Alert rules |
| Alerting, and when it fires | Three rules, checked every minute, all mailed to the "Personal-email" contact point. **Backend 5xx errors** (critical): more than 2 in 5 minutes. **Backend latency high** (warning): p95 above 1000 ms over 5 minutes. **Failed login burst** (warning): more than 5 failed logins in 5 minutes. [TO FILL: proof it fired] | `monitoring/backend-alert-rules.yaml`, screenshot |

## Link to requirements

Performance QR (500 ms for 95% of requests) and availability QR.

## Decisions and trade offs

* **Grafana Cloud instead of hosting Loki ourselves:** no extra containers on a small server. Trade off: logs leave our server.
* **Logs, not metrics, for alerts:** quick to set up. Trade off: a dead backend writes no log lines, so a log based rule stays silent. That needs an outside check on `/api/health/`.

## Problems we ran into

* **Alloy port open to the internet:** found in review, bound to 127.0.0.1.
* **No frontend logs on production:** the Faro URL only existed in the development settings. It is now passed as a build argument.
* **Docker socket:** Alloy needs it to read logs, and a read only mount does not stop it controlling containers. Written down as a known limitation.

## What we learned


### Andrea

* **Could not do at the start, can do now:** [TO FILL]
* **Would do differently next time:** [TO FILL]
* **Already knew before this course:** [TO FILL]

## Use of generative AI

[TO FILL: Andrea's use.] Claude reviewed the observability MR. This document was drafted with Claude from our own project notes and checked by us.
