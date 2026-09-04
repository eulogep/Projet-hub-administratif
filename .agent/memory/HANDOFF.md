# HANDOFF — MACHINE MIGRATION

## Project

Professional Hub

## Migration source

Windows

## Target

macOS

## Current objective

Move the complete reproducible project to macOS using Git and repository-owned memory, without relying on prior Codex conversation history.

## Current phase

Structural handoff while the active product ticket is blocked at its external Cloudflare R2 release gate.

## Current ticket

T-0008 — Private Documents

## Ticket status

`BLOCKED_R2_ENVIRONMENT`

## Current branch

`main`

## Repository

`https://github.com/eulogep/Projet-hub-administratif.git`

Source checkout: `D:\PROJET HUB ADMINISTRATIF`

## Last verified commit

`74743c4` — T-0008 application implementation. The handoff commit following it changes only README, ignore rules, and `.agent/memory`.

## Remote state

Before handoff finalization, `origin/main` was `694b38f` and local `main` contained `bc311e7` plus `74743c4`. The handoff workflow pushes `main` without force; verify the final remote HEAD after cloning.

## What has already been completed

- T-0001: email/password authentication, SSR session handling, idempotent personal-workspace bootstrap and base RLS.
- T-0002: responsive application shell, desktop/mobile navigation, design tokens, loading/error/empty states, keyboard focus and accessibility coverage.
- T-0003: organization list/create/detail/edit/logical archive and workspace isolation.
- T-0004: personal contacts, organization links, interactions, follow-up, search and archive.
- T-0005: missions, tasks and subtasks with hierarchy and completion behavior.
- T-0006: CROUS work periods/logs, duration calculations, overlap confirmation and summaries.
- T-0007: projects linked to organizations and missions, with lifecycle and archive behavior.
- T-0008 local implementation: document metadata, immutable versions, persistent upload sessions, owner RLS, Cloudflare R2 provider abstraction, Uppy PUT/multipart flow, exact-key authorization, magic-byte checks, streaming SHA-256, idempotent finalization, version history, short-lived attachment download, filters and logical archive.

## Current implementation state

The application code for T-0008 is committed. PostgreSQL owns metadata and authorization; R2 is binary storage only. Supabase Storage is disabled. The configured architecture target is 500 MiB, multipart begins above 5 MiB, and parts are 16 MiB. The browser never receives R2 credentials. Finalization uses a Node streaming boundary and no Worker.

The real provider gate stopped before network access because every required R2 variable was missing. Consequently bucket privacy/jurisdiction/token scope/CORS, real PUT/multipart, 1–500 MiB performance, interruption/retry/abort, signed-URL attacks, download and runtime memory remain unverified. T-0008 is not approved or ready for review.

## Last work performed

Executed the T-0008 external-falsification preflight. It reported all five R2 variables plus `DOCUMENT_MAX_FILE_SIZE_BYTES` as missing, updated the implementation report with `NOT RUN` evidence, and set project status to `BLOCKED_R2_ENVIRONMENT`. No remote objects or large local fixtures were created.

## Open review findings

- Approved private EU-jurisdiction R2 bucket is unavailable.
- Bucket-scoped Object Read & Write token is unavailable.
- Exact production/development CORS policy is not deployed or verified.
- Real application-path size matrix from 1 through 500 MiB is not run.
- Network interruption, forced part failure, abort, orphan cleanup, concurrent replacement, old-version download and URL tampering are not run against R2.
- Production finalization duration and memory behavior at 100/250/500 MiB are unknown.
- One full E2E run ended 10/11 because Contacts timed out; the exact Contacts scenario passed alone immediately afterward. Treat as an observed flake, not a hidden pass.

## Exact next action

Provision and approve one private EU R2 bucket, a bucket-scoped server token and exact allowed origins; set the six required variables locally on the Mac, then execute the existing T-0008 external falsification gate with synthetic fixtures only.

## Files relevant to next action

- `docs/reports/T-0008-IMPLEMENTATION-REPORT.md`
- `docs/research/T-0008-R2-LARGE-FILE-ARCHITECTURE-REPORT.md`
- `docs/tickets/T-0008-PRIVATE-DOCUMENTS.md`
- `docs/project/PROJECT-STATE.md`
- `.env.example`
- `src/integrations/storage/r2/`
- `src/modules/documents/`
- `src/app/api/documents/`
- `tests/e2e/document-management.spec.ts`
- `supabase/migrations/202609030008_private_documents_r2.sql`

## Tests already run

| Command | Result | Evidence date |
| --- | --- | --- |
| `npm run typecheck` | PASS | 2026-09-04 |
| `npm run lint` | PASS | 2026-09-04 |
| `npm test` | PASS, 32/32 | 2026-09-04 |
| `npm run build` | PASS, Next.js production build | 2026-09-04 |
| `npm run db:reset` | PASS through T-0008 | 2026-09-03 |
| `npm run test:db` | PASS, 19/19 | 2026-09-03 |
| `npx playwright test tests/e2e/document-management.spec.ts` against `next start` | PASS, 1/1 including 360 px and axe | 2026-09-03 |
| Full `npm run test:e2e` | 10/11; Contacts timeout | 2026-09-03 |
| Isolated Contacts lifecycle E2E rerun | PASS, 1/1 | 2026-09-03 |

## Tests not run

- DB/RLS and E2E in the 2026-09-04 handoff session because Docker Desktop was stopped.
- Every real-R2 gate: provider preflight, CORS, size matrix, recovery, abort, cleanup, security attacks, download, memory and performance.
- No formatter command exists in `package.json`; formatting is `NOT_RUN`, not a claimed pass.

## Known failures

- Product blocker: `BLOCKED_R2_ENVIRONMENT`.
- No reproducible local application failure is open.
- Contacts E2E timing remains a known non-reproducible flake observation.

## Environment

- Source OS: Windows.
- Target OS: macOS.
- Node: 24.18.0 source verification; project engine requires >=20.9.
- npm: 11.16.0.
- Git: 2.55.0.windows.3 on source; use current Git on macOS.
- Supabase CLI: 2.116.0, pinned in devDependencies.
- Docker: 29.7.2 and Compose 5.3.1 installed on source; Docker daemon was stopped during handoff.
- Next.js: 16.3.3.
- Playwright: 1.62.1.

## Local services

- Docker is required for local Supabase.
- Supabase API: `127.0.0.1:54321`.
- PostgreSQL: `127.0.0.1:54322`.
- Supabase Studio: `127.0.0.1:54323`.
- Local SMTP test service: `127.0.0.1:54324`.
- Next.js development/production server: `127.0.0.1:3000`.
- Supabase Storage and Realtime are disabled in `supabase/config.toml`.

## Required environment variables

Local Supabase values, obtained from `npm run supabase:start`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_TEST_URL`
- `SUPABASE_TEST_PUBLISHABLE_KEY`

Real T-0008 R2 values, obtained from the approved Cloudflare account and never committed:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `DOCUMENT_MAX_FILE_SIZE_BYTES`

Do not add a Supabase service-role key. Do not prefix R2 credentials with `NEXT_PUBLIC_`.

## Setup from fresh clone

```bash
git clone https://github.com/eulogep/Projet-hub-administratif.git
cd Projet-hub-administratif
npm ci
cp .env.example .env.local
# Start Docker Desktop before the next command.
npm run supabase:start
# Put only the reported local URL/publishable key into .env.local.
npm run db:reset
npx playwright install chromium
npm run dev
```

Then, in separate terminal sessions as needed:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
npm run test:e2e
```

## Database state

- Eight forward migrations exist under `supabase/migrations/`, ending with `202609030008_private_documents_r2.sql`.
- `npm run db:reset` recreates the database and applies all migrations plus `supabase/seed.sql`.
- The seed is intentionally generic and contains no personal document data.
- Local users/test rows are disposable and must not be migrated through Git.
- R2 objects are external and were not created by the blocked gate.

## Git state

- Branch: `main`.
- Application commit: `74743c4`, preceded by T-0007 commit `bc311e7`.
- Remote verified before final push: `origin/main` at `694b38f`.
- No stash and no additional local branch were found.
- Root-level private working files are intentionally excluded by `.gitignore` and must be transferred separately only if the user explicitly needs them.

## Decisions that must NOT be reopened

- `T-XXXX` is the execution numbering; `HUB-XXX` is historical only.
- T-0001 through T-0007 are approved.
- One user owns one personal workspace; owner-workspace RLS is the authorization boundary.
- PostgreSQL is the document source of truth; Cloudflare R2 stores binary objects only.
- R2 must be private, EU-jurisdiction, server-credentialed and bucket-scoped.
- Uppy 6 uses server-side `signRequest`; no Tus, Companion or browser credentials.
- File types are PDF/PNG/JPEG only; validation includes extension, MIME, magic bytes, actual size and streaming SHA-256.
- Versions are immutable and archive is logical.
- No Worker may be introduced before runtime evidence and explicit human approval.
- The 500 MiB architecture target is not a product claim before the real gate passes.

## Things that must NOT be done next

- Do not start T-0009.
- Do not mark T-0008 approved or ready for review.
- Do not bypass Uppy/application flow with a direct SDK benchmark.
- Do not weaken verification or CORS to pass the gate.
- Do not add a Worker, OCR, antivirus, preview, sharing, Gmail, WhatsApp, n8n or AI.
- Do not commit `.env.local`, R2 credentials, root-level private reports/resources, local DB data or real documents.

## Recovery / rollback

- Recover the project with `git clone`, `npm ci`, `.env.local`, `npm run supabase:start` and `npm run db:reset`.
- Roll back application code with a reviewed revert commit; never force-push or delete R2 objects by prefix.
- Failed synthetic R2 tests may clean only the exact session/upload ID/object key they created.
- If runtime verification cannot safely finalize the largest file, retain authoritative verification and return `FINALIZATION_RUNTIME_BLOCKED`; propose but do not implement a worker.

## Exact resume prompt

Read `AGENTS.md`, `.agent/memory/STATE.md`, `.agent/memory/HANDOFF.md`, `docs/project/PROJECT-STATE.md` and the T-0008 implementation report. Verify the clean clone and local Supabase setup on macOS. Do not start T-0009. Resume only the real T-0008 R2 falsification gate after confirming the approved private EU bucket, bucket-scoped credentials and exact CORS configuration; use synthetic fixtures and report every unexecuted check as `NOT_RUN`.
