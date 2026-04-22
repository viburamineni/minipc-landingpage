# MiniPC Landing Page

A Next.js dashboard for a home server.  
It shows:

- System metrics
- Service health/status
- Quick action links (for example SSH)
- One-click copy/open actions for service URLs

## Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn-style UI components

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open:

```text
http://localhost:3000
```

## Use On Other Devices (Same Network)

Run dev server on all interfaces:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Then open on another device:

```text
http://<your-local-ip>:3000
```

## Production Commands

```bash
npm run lint
npm run build
npm run start
```

## Project Configuration

Service cards and quick actions are defined in:

- `lib/service-catalog.ts` for service link patterns, probe targets, and status endpoints
- `components/home-page-client.tsx` for quick actions

Service cards now use same-origin `/api/status/*` routes for health checks, so status is determined server-side and no longer depends on each client browser trusting the individual service certificates.

Service links still adapt to the hostname the browser used to open the dashboard, while preserving the configured HTTPS ports and paths for each service.

This app is no longer configured for static export. Run it with a Next.js server (`npm run dev` or `npm run start`) so the API routes are available.

Page metadata and app version wiring are in:

- `app/layout.tsx`

## Maintainer Note

Before committing changes, bump `package.json` version so the `data-app-version` attribute in `app/layout.tsx` stays accurate.
