# Professional Hub

Professional Hub is a private personal administrative workspace built with Next.js, Supabase/PostgreSQL and Cloudflare R2. The Git repository is the technical source of truth; `docs/project/PROJECT-STATE.md` and `.agent/memory/` contain the resumable project state.

## Current state

- T-0001 through T-0007 are approved: authentication/personal workspace, responsive shell, organizations, contacts, missions/tasks, CROUS work-hour tracking, and projects.
- T-0008 Private Documents is implemented locally but `BLOCKED_R2_ENVIRONMENT`.
- The real R2 release gate is not run. Do not advertise the 500 MiB target and do not start T-0009.

## Architecture

- Next.js 16 App Router, React 19, strict TypeScript and Tailwind CSS.
- Supabase Auth with cookie-based SSR through `@supabase/ssr`.
- PostgreSQL metadata with owner-workspace Row Level Security.
- Cloudflare R2 for private T-0008 binary objects only; PostgreSQL remains the business source of truth.
- Uppy 6 with server-side S3-compatible request signing.
- No service-role key, public document bucket, collaboration/RBAC expansion, OCR, AI or background Worker.

## Prerequisites

- Git.
- Node.js 20.9 or later and npm 11 or later. Last verified on Windows: Node 24.18.0 and npm 11.16.0.
- Docker Desktop (or another Docker Engine with Compose) running.
- Supabase CLI, installed as the pinned project dev dependency and invoked through npm scripts.
- Playwright Chromium for E2E tests.
- For the blocked real-R2 gate only: an approved private EU-jurisdiction R2 bucket and a bucket-scoped Object Read & Write token.

## Clone and install

macOS/Linux:

```bash
git clone https://github.com/eulogep/Projet-hub-administratif.git
cd Projet-hub-administratif
npm ci
```

Windows PowerShell:

```powershell
git clone https://github.com/eulogep/Projet-hub-administratif.git
Set-Location Projet-hub-administratif
npm.cmd ci
```

## Environment variables

Copy the example file without committing the result:

macOS/Linux:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Local Supabase variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_TEST_URL
SUPABASE_TEST_PUBLISHABLE_KEY
```

Obtain the local URL and publishable key from `npm run supabase:start`. Never add `SUPABASE_SERVICE_ROLE_KEY`; application and tests use RLS with non-privileged clients.

Server-only R2 variables required to resume the T-0008 external gate:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ENDPOINT
DOCUMENT_MAX_FILE_SIZE_BYTES
```

Obtain them from the approved Cloudflare account. The token must be scoped to the private Professional Hub bucket. The endpoint must match the EU bucket jurisdiction. Never paste secret values into documentation, Git, browser variables or test reports.

## Local backend and migrations

Start Docker first, then run:

```bash
npm run supabase:start
npm run db:reset
```

On Windows use `npm.cmd` in place of `npm` when PowerShell execution policy blocks `npm.ps1`.

`db:reset` applies every migration under `supabase/migrations/` through `202609030008_private_documents_r2.sql`, then the deliberately non-personal `supabase/seed.sql`. Tests create disposable synthetic records only.

## Development

```bash
npm run dev
```

Open `http://127.0.0.1:3000/login`. Local email confirmation is disabled in `supabase/config.toml` for deterministic development and E2E tests.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
npx playwright install chromium
npm run test:e2e
```

Database/RLS and E2E tests require the local Supabase stack and valid non-privileged values in `.env.local`. On the source Windows filesystem, `next dev` has previously compiled slowly; production-path E2E can be run after `npm run build` with `npm run start` in one terminal and `npm run test:e2e` in another. Re-evaluate this on macOS rather than assuming the same limitation.

The real R2 gate is a separate manual/external validation described in `docs/reports/T-0008-IMPLEMENTATION-REPORT.md`. Direct SDK uploads cannot substitute for the real Uppy/application path.

## Project governance and recovery

- Current machine-readable project status: `docs/project/PROJECT-STATE.md`.
- Cross-machine handoff: `.agent/memory/HANDOFF.md`.
- Compact migration sequence: `.agent/memory/MIGRATION.md`.
- Ticket contracts and reports: `docs/tickets/` and `docs/reports/`.
- Never commit real professional documents, identity data, credentials or local audit material.
