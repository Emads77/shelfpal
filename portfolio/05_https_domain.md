# Show and tell: HTTPS and domain

**Learning outcome:** You make your application's environments accessible on a domain via https.
**Rubric row:** HTTPS and domain (5%)
**Main work by:** Emad (#83, environment indicator)

## What we built

Both environments have their own domain: https://shelfpal.saxion.college for production and https://acc.shelfpal.saxion.college for acceptance. Caddy runs on the server, gets and renews the certificates by itself, redirects HTTP to HTTPS and spreads traffic over two frontend containers. The app shows which environment you are in and lets you switch.

## Proof

| What                                             | Where to see it                                                 |
| ------------------------------------------------ | --------------------------------------------------------------- |
| Caddy configuration                              | `deploy/Caddyfile`                                              |
| Firewall                                         | `deploy/firewall.sh`                                            |
| Environment badge                                | `frontend/src/shared/ui/EnvironmentBadge.jsx` and its two tests |


## What the assessor looks at

| Assessor looks at                                   | Our answer                                                                                                                                                                                                                                                                                                                                     | Proof                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Both environments on HTTPS with a valid certificate | Yes, Let's Encrypt certificates through Caddy.                                                                                                                                                                                                                                                                                                 | Screenshots                                         |
| How certificates are managed and renewed            | Caddy requests and renews them automatically, no cron job or manual step.                                                                                                                                                                                                                                                                      | `deploy/Caddyfile`                                  |
| How the frontend knows its backend                  | The frontend calls `/api/` on its own domain. nginx inside the frontend container forwards it to the backends of the same stack, so one image serves both environments. `client.js` falls back to `/api` when `VITE_API_URL` is not set, and only `.env.development` sets it (to localhost), so the built image always uses the relative path. | `frontend/nginx.conf`, `frontend/src/api/client.js` |
| How a user knows the environment                    | Acceptance shows a strip "Acceptance environment. Data here is for testing only." with a link to production. Production shows only a small, quiet link to acceptance. Local development shows its own strip.                                                                                                                            
## Link to requirements

Confidentiality QR: all traffic is encrypted.

## Decisions and trade offs

- **Caddy on the host instead of in Docker:** one proxy for both stacks, with automatic certificates. Trade off: one more service to keep updated outside the pipeline.
- **Environment chosen from the hostname at runtime:** one image works everywhere. Trade off: a new domain needs a code change.

## Problems we ran into

- **An old service worker from a demo app** made both domains hang in a normal browser window while incognito worked. Fixed by unregistering it and clearing site data.

## What we learned

### Emad

- **Could not do at the start, can do now:** Put an app on its own domain with a valid certificate. I learned how DNS, a reverse proxy and certificates fit together: the domain points at the server, Caddy answers on ports 80 and 443, gets a Let's Encrypt certificate by itself and passes traffic on to the right stack. I also learned that the proxy has to forward the original host and protocol, because when nginx lost the Host header, Django rejected every request with a 400.

- **Would do differently next time:** Let the pipeline deploy the Caddyfile too. Now the live config on the server is still updated by hand, so the repo and the server can drift apart. I would also test every change in a fresh browser profile, since an old service worker cost me time while the server was fine all along.

- **Already knew before this course:** What HTTPS is and why it matters.

## Use of generative AI

Claude helped write the Caddyfile and the environment badge. This document was drafted with Claude from our own project notes and checked by us.
