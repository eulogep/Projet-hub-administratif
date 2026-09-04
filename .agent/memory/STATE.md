PROJECT: PROFESSIONAL_HUB
CURRENT_BRANCH: main
LAST_VERIFIED_COMMIT: 07a872a
CURRENT_TICKET: T-0008 — Private Documents
CURRENT_TICKET_STATUS: BLOCKED_R2_ENVIRONMENT
LAST_APPROVED_TICKET: T-0007 — Projects Foundation
COMPLETED_FEATURES: T-0001 authentication/personal workspace; T-0002 responsive shell; T-0003 organizations; T-0004 contacts; T-0005 missions/tasks/subtasks; T-0006 CROUS work hours; T-0007 projects
PARTIAL_FEATURES: T-0008 local database/RLS, R2 provider, upload sessions, Uppy UI, streaming validation, versions, download, archive and tests implemented; real R2 gate not run
OPEN_FINDINGS: Private EU R2 bucket/token/CORS/runtime unverified; 1–500 MiB size matrix unverified; Contacts E2E had one non-reproducible timeout in the last full run
TESTS_PASS: 2026-09-04 typecheck, ESLint, unit 32/32, production build; 2026-09-03 DB/RLS 19/19, Documents E2E 1/1, isolated Contacts rerun 1/1
TESTS_FAIL: NONE reproducible
TESTS_NOT_RUN: 2026-09-04 DB/RLS and E2E because Docker Desktop was stopped; real R2 preflight, uploads, recovery, CORS, URL tampering, memory and runtime gates
BLOCKERS: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT and DOCUMENT_MAX_FILE_SIZE_BYTES are not configured; approved private EU R2 infrastructure unavailable
ACTIVE_RISKS: Do not advertise 500 MiB; do not expose R2 secrets; do not migrate root-level private working documents through Git; do not start T-0009
NEXT_AUTHORIZED_ACTION: Provision and approve the private EU R2 bucket plus bucket-scoped server credentials and exact CORS origins, then execute the T-0008 external falsification gate with synthetic fixtures only
