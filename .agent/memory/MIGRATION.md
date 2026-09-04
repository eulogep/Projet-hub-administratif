# MACHINE MIGRATION SNAPSHOT

Generated:
2026-09-04T13:23:02+02:00

Source machine:
Windows

Target machine:
macOS

Repository:
https://github.com/eulogep/Projet-hub-administratif.git

Branch:
main

Commit:
07a872a (verified handoff baseline; continuity contract follows)

Current ticket:
T-0008 — Private Documents

Status:
BLOCKED_R2_ENVIRONMENT

Next exact action:
Provision the approved private EU R2 environment, then run the T-0008 external falsification gate with synthetic fixtures.

Clone command:
`git clone https://github.com/eulogep/Projet-hub-administratif.git`

Setup commands:
`cd Projet-hub-administratif && npm ci && cp .env.example .env.local && npm run supabase:start && npm run db:reset && npx playwright install chromium`

Verification commands:
`npm run typecheck && npm run lint && npm test && npm run test:db && npm run build && npm run test:e2e`

Important local-only items:
Root professional resources, audit notes, report documents, `.env.local`, local Supabase data and generated artifacts are excluded from Git; transfer them separately only if explicitly required.

Missing items:
Approved R2 bucket, bucket-scoped credentials, jurisdiction endpoint, exact CORS origins and production runtime evidence.

Migration blockers:
NONE for source-code setup; T-0008 release remains blocked by R2 infrastructure.

Resume sequence:

1. Clone `main` and read `.agent/memory/CONTEXT.md`, then `STATE.md` and `HANDOFF.md`.
2. Install Node/npm/Docker dependencies and create `.env.local` from the example.
3. Start/reset Supabase and rerun local verification.
4. Confirm the private EU R2 configuration without exposing secrets.
5. Execute only the T-0008 external falsification gate; do not start T-0009.
