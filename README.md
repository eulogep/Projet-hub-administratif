# Professional Hub

Professional Hub is a private personal workspace. T-0001 implements the secure technical foundation: Next.js, email/password authentication, one personal workspace per user, and Row Level Security (RLS). T-0002 adds the responsive application shell, accessible navigation, design tokens, and consistent loading, error, and empty states. It intentionally contains no CRM, task management, document storage, calendar data, integrations, or AI yet.

The product and reuse decisions remain documented in the [Open Source Reuse Report](docs/research/PROFESSIONAL-HUB-OPEN-SOURCE-REUSE-REPORT.md).

## Architecture

- Next.js App Router, React, strict TypeScript, Tailwind CSS, and shadcn/ui primitives.
- Supabase Auth with cookie-based SSR through `@supabase/ssr`.
- PostgreSQL tables `profiles`, `workspaces`, and `organizations`.
- V1 ownership rule: one user owns one personal workspace through `workspaces.owner_user_id`.
- RLS is the database authorization boundary; no `workspace_members`, invitations, teams, or advanced RBAC.
- `bootstrap_personal_workspace()` creates the profile and workspace idempotently under the authenticated user's own database role.
- The protected shell uses a desktop sidebar from `lg`, a five-destination mobile bar, visible keyboard focus, and a skip link.
- Routes for future modules currently expose explicit empty states only; their business behavior remains deferred to later tickets.

## Current ticket status

- T-0001 — Bootstrap, Authentication and Personal Workspace Foundation: verified.
- T-0002 — Design System and Responsive Shell: `READY_FOR_REVIEW`.
- T-0003 and later business modules: not started.

## Requirements

- Node.js 20.9 or later. The verified development runtime is Node.js 24.
- npm 11 or later.
- Docker Desktop running for the local Supabase stack.
- Git is recommended, although the supplied workspace was not initially a Git repository.

## Environment variables

Copy `.env.example` to `.env.local`, then replace the placeholder with values returned by `npm run supabase:start`.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-key
SUPABASE_TEST_URL=http://127.0.0.1:54321
SUPABASE_TEST_PUBLISHABLE_KEY=your-local-publishable-key
```

These values are browser-safe only because every exposed table has RLS. Never add `SUPABASE_SERVICE_ROLE_KEY`; neither the app nor the RLS tests require it. `.env.local` and `.env.test.local` are ignored by Git.

## Installation

```powershell
npm.cmd ci
```

On PowerShell installations that allow npm scripts, `npm ci` is equivalent.

## Supabase local setup

Start Docker Desktop, then run:

```powershell
npm.cmd run supabase:start
```

Copy the reported API URL and publishable key into `.env.local`. Local email confirmation is disabled for deterministic development and E2E tests; production may enable confirmation, in which case `/auth/callback` completes the PKCE flow.

Authentication uses email/password for V1. This was chosen over magic links because the required login/logout E2E path must not depend on an external mailbox. OAuth providers are explicitly out of scope.

## Database migrations

Recreate the local database from zero:

```powershell
npm.cmd run db:reset
```

The reset applies, in order:

1. `202608310001_identity_workspace.sql` — tables, constraints, timestamps, and idempotent workspace bootstrap.
2. `202608310002_identity_workspace_rls.sql` — grants and per-operation RLS policies.
3. `seed.sql` — deliberately contains no personal data. Integration tests create only generic demo organizations.

## Start development

```powershell
npm.cmd run dev
```

Open `http://127.0.0.1:3000/login`. A first authenticated visit calls the idempotent bootstrap and opens the protected personal workspace.

## Run tests

Static and unit verification:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
```

Database integration and RLS matrix (requires local Supabase and `.env.local`):

```powershell
npm.cmd run db:reset
npm.cmd run test:db
```

Minimal browser journey (requires local Supabase and a Playwright Chromium installation):

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

The RLS tests create User A/Workspace A and User B/Workspace B with the publishable client. They verify cross-workspace `SELECT`, `INSERT`, `UPDATE`, and `DELETE` denial in both directions. The tests refuse to run if a service-role environment variable is present.

## Build

```powershell
npm.cmd run build
```

Run the complete non-database check with:

```powershell
npm.cmd run check
```

## Security assumptions

- `auth.uid()` is the authenticated identity and `workspaces.owner_user_id` is the V1 ownership rule.
- Browser-supplied workspace IDs are never trusted; RLS validates ownership for every table operation.
- The protected layout validates the user with `auth.getUser()` on the server.
- `proxy.ts` refreshes SSR session cookies; it does not grant access by itself.
- The workspace bootstrap is `SECURITY INVOKER`, so it cannot bypass RLS.
- No privileged Supabase key, OAuth token, storage bucket, personal seed, or real organization data belongs in T-0001.
- Deleting an owned workspace cascades its minimal organizations. Production deletion and export workflows belong to a later ticket.

## Design documentation

The prior conception files are under [`docs/conception`](docs/conception). They describe future modules but do not authorize implementing them as part of T-0001.
