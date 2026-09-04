# PROJECT CONTEXT

## Identity

- Project: Professional Hub
- Repository: `https://github.com/eulogep/Projet-hub-administratif.git`
- Official execution numbering: `T-XXXX`
- Historical `HUB-XXX` references are functional context only; never create a new HUB ticket.
- Git plus `.agent/memory/` and `docs/` are the durable source of truth. Chat history is never required.

## Product purpose

Professional Hub is a private personal workspace for organizing professional and administrative contexts. It currently covers authentication, one owner-controlled workspace, responsive navigation, organizations, contacts, missions/tasks, CROUS work hours, projects, and the local portion of private documents.

## Technical architecture

- Next.js 16 App Router, React 19, strict TypeScript and Tailwind CSS.
- Supabase Auth with SSR cookies.
- PostgreSQL/Supabase metadata protected by owner-workspace RLS.
- Local Supabase runs through Docker and the pinned CLI.
- Cloudflare R2 is the only approved binary store for T-0008 documents.
- PostgreSQL remains authoritative for document metadata, versions, relationships, permissions and states.
- Supabase Storage is disabled and must not become a second document store.

## Governance state

- T-0001 through T-0007 are approved.
- Active ticket: T-0008 — Private Documents.
- T-0008 local implementation is committed but its real provider gate is blocked.
- Current blocker: `BLOCKED_R2_ENVIRONMENT`.
- T-0009 is not authorized.

## T-0008 fixed decisions

- Private EU-jurisdiction R2 bucket with bucket-scoped Object Read & Write credentials.
- R2 credentials are server-only and never use a `NEXT_PUBLIC_` prefix.
- Uppy 6 uses server-side `signRequest`; no Tus, Companion or browser credentials.
- PDF, PNG and JPEG only.
- Architecture target 500 MiB, configurable; not an advertised capability before the complete real gate passes.
- Single PUT through 5 MiB; multipart above 5 MiB; 16 MiB parts.
- Persistent upload sessions and opaque workspace/document/version keys.
- Size, extension, MIME and magic-byte validation plus authoritative server-streamed SHA-256.
- Immutable versions, idempotent concurrency-safe finalization, logical archive, short-lived attachment downloads.
- No Worker unless runtime evidence proves it necessary and a human explicitly approves it.

## Security invariants

- Never commit real professional documents, identity material, audit notes, credentials, `.env.local`, local DB data or generated uploads.
- Never use a Supabase service-role key in application or tests.
- Never trust a client-provided workspace, bucket, object key, document ID, version ID or upload ID without server authorization.
- Never make the R2 bucket public or use wildcard CORS as a test workaround.
- Never delete R2 objects by prefix; cleanup uses exact session, upload ID and object key.
- Automated tests use synthetic data only.

## Repository map

- `docs/project/PROJECT-STATE.md`: canonical ticket/mode status.
- `docs/tickets/`: approved ticket contracts.
- `docs/reports/T-0008-IMPLEMENTATION-REPORT.md`: implementation and external-gate evidence.
- `.agent/memory/STATE.md`: compact verified state.
- `.agent/memory/HANDOFF.md`: zero-history recovery guide.
- `.agent/memory/MIGRATION.md`: short machine-migration sequence.
- `src/modules/`: business modules.
- `src/integrations/storage/r2/`: server-only R2 adapter.
- `src/app/api/documents/`: protected document upload/download endpoints.
- `supabase/migrations/`: reproducible database state.
- `tests/`: unit, DB/RLS, integration and E2E suites.

## Resume rule

Read, in order: `AGENTS.md`, this file, `.agent/memory/STATE.md`, `.agent/memory/HANDOFF.md`, `docs/project/PROJECT-STATE.md`, and the active ticket/report. Verify Git and the documented environment before acting. Execute only `NEXT_AUTHORIZED_ACTION` from STATE. If these files do not explain the next action without chat history, report `CONTINUITY_FAILURE` and stop.
