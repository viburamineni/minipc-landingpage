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

- `components/home-page-client.tsx` (`serviceDefinitions` and `buildQuickActions`)

Service and SSH links automatically use the hostname from the current request, so opening the dashboard at `http://192.168.4.124:3000` will generate service URLs against `192.168.4.124` instead of a fixed IP.

Page metadata and app version wiring are in:

- `app/layout.tsx`

## Maintainer Note

Before committing changes, bump `package.json` version so the `data-app-version` attribute in `app/layout.tsx` stays accurate.
