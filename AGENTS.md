# AGENTS.md

This repository powers the `mini.pc` landing page.

The goal of development on this repo is simple:

- a push to `main` should be enough
- GitHub Actions should build and publish the static site to `pages`
- the MiniPC should then pick up the updated `pages` branch automatically
- no extra manual patching on the MiniPC should be required for normal site changes

## Source Of Truth

- Develop on `main`
- Treat `pages` as generated output only
- Do not hand-edit the `pages` branch as part of normal development
- The deployed static site is published by `.github/workflows/publish-pages.yml`

## Deployment Contract

The current deployment flow is:

1. Push to `main`
2. GitHub Actions runs `npm ci` and `npm run build`
3. The build must produce `out/`
4. The workflow adds `out/.nojekyll`
5. The workflow publishes `out/` to the `pages` branch
6. The MiniPC updater pulls the `pages` branch and serves it

Because of this, **anything that breaks static export breaks deployment**.

## Hard Requirements

Keep these intact unless you are intentionally redesigning the deployment system:

- `next.config.mjs` must keep `output: "export"`
- `npm run build` must generate `out/`
- `.github/workflows/publish-pages.yml` must continue publishing `out/` to `pages`
- The site must remain fully usable as a static export

## Do Not Introduce

Do not introduce features that require a live Next.js server on the MiniPC unless the deployment system is also being changed deliberately.

That means:

- no Next.js API routes as a required runtime dependency
- no server-only request handlers that must exist in the exported site
- no assumptions that `next start` is running in production
- no deployment changes that remove `out/` generation

If you need backend behavior, prefer a same-origin endpoint contract that can be provided by the host web server or sidecar services.

## Service Status Strategy

The landing page must **not** determine service health by browser-probing each service directly.

Bad pattern:

- browser fetches `https://service-host/favicon.ico`
- browser-side cert trust and mixed HTTP/HTTPS issues make status unreliable

Required pattern:

- frontend fetches same-origin endpoints like `/api/status/...`
- host-side infrastructure determines real service health

Current expected status endpoints:

- `/api/status/portainer`
- `/api/status/pterodactyl`
- `/api/status/pihole`
- `/api/status/code-server`
- optional aggregate endpoint: `/api/status/all`

Expected semantics:

- `204` means online
- `503` means offline
- JSON boolean responses are also acceptable

## Service Links

Visible service links in the UI should be derived from the **current browser hostname**, not hardcoded to one specific IP in rendered links.

Current service targets:

- Portainer: `https://<hostname>:9443`
- Pterodactyl: `https://<hostname>:8444`
- Pi-hole: `https://<hostname>/admin/`
- code-server: `https://<hostname>:8080/login`
- SSH shortcut: `ssh://administrator@<hostname>:22`

Use the helpers in `lib/service-catalog.ts` and `components/home-page-client.tsx` rather than reintroducing hardcoded visible URLs.

## Important File Roles

- `lib/service-catalog.ts`
  Defines service IDs, status endpoints, and link targets

- `components/service-status.tsx`
  Must use same-origin status URLs, not browser-side direct service probes

- `components/home-page-client.tsx`
  Builds user-visible links from `window.location.hostname`

- `next.config.mjs`
  Must preserve static export unless deployment changes too

- `.github/workflows/publish-pages.yml`
  Must continue publishing `out/` to `pages`

## Verification Before Pushing

At minimum, run:

```bash
npm ci
npm run build
test -d out
test -f out/index.html
test -f out/.nojekyll || true
```

For status-architecture changes, also verify the exported output still contains same-origin status endpoints and does not fall back to favicon probing.

Examples:

```bash
grep -R "/api/status/" out
grep -R "favicon.ico" out/_next/static/chunks/app || true
```

Interpretation:

- `/api/status/` references should exist for service badges
- favicon references for status probing should not be reintroduced in app logic

## When A Change Is Safe To Push

A change is safe to push when all of the following are true:

- `npm run build` succeeds
- `out/` is generated
- the Pages workflow still matches the static export model
- the frontend still uses same-origin status endpoints
- visible service links still work from whatever hostname the browser used

## When To Stop And Reassess

Stop and reassess if your change requires any of these:

- a live Next.js runtime on the server
- editing the MiniPC nginx or sidecar config just to keep existing features working
- changing service IDs or `/api/status/...` paths without coordinating the host-side provider
- removing static export or the `pages` publish workflow

Those changes are possible, but they are deployment changes, not ordinary site edits.
