# T-0008 IMPLEMENTATION REPORT

## STATUS

`PARTIALLY_COMPLETE`

The application, database, security boundary, UI, and synthetic local tests are implemented. The mandatory real-R2 and 500 MiB runtime gates are blocked because no approved private EU R2 bucket or credentials are configured. T-0008 is not `READY_FOR_REVIEW` and is not self-approved.

## ARCHITECTURE IMPLEMENTED

Next.js authenticates every request with Supabase Auth, PostgreSQL owns document/version/session state under RLS, and Cloudflare R2 stores binary objects only. No Supabase Storage document store or Worker was introduced.

## DEPENDENCIES

Exact versions: Uppy core/dashboard/aws-s3 6.0.0, AWS S3 client/presigner 3.1121.0, and file-type 21.3.4. No Tus, Companion, lib-storage, hash library, or secondary R2 SDK.

## DATABASE CHANGES

Migration `202609030008_private_documents_r2.sql` creates `documents`, `document_versions`, and `document_upload_sessions`, context constraints, logical archive fields, expiration validation, immutable versions, indexes, and a concurrency-safe idempotent `finalize_document_upload` transaction.

## RLS

All three tables enable owner-workspace RLS. Anonymous access is revoked. Two-user tests cover foreign SELECT/INSERT/UPDATE/finalization denial. Versions expose SELECT only and reject UPDATE/DELETE through an immutable trigger.

## R2 CONFIGURATION

Credentials are read server-side only. Configuration requires the exact EU endpoint `<account>.eu.r2.cloudflarestorage.com` and a matching account ID. `.env.example` contains empty placeholders only. A bucket's privacy, jurisdiction, and token scope cannot be verified until the approved Cloudflare environment is supplied.

## CORS

Not applied because no bucket is available. Required deployment policy: exact production origin and separate development origin; methods GET/PUT/POST/DELETE; expose ETag and Location; add only observed required request headers. Wildcard origins/headers are prohibited without review.

## STORAGE PROVIDER

`DocumentStorageProvider` separates domain logic from R2. The R2 implementation supports exact-operation presigning, HEAD, signature range reads, full streams, short attachment downloads, multipart abort, and exact-key deletion.

## UPLOAD SESSION MODEL

Persistent database sessions use initiated/uploading/completing/verifying/completed/failed/aborted/expired. The server derives workspace, document, bucket, and opaque key. Arbitrary client keys and foreign upload IDs are rejected.

## UPPY FLOW

One PDF/PNG/JPEG is accepted per operation. Uppy uses server-side `signRequest`; no credentials reach the browser. The UI announces progress, verification, retry, failure, and cancellation.

## PUT FLOW

Files at or below 5 MiB use single PUT to the exact session key.

## MULTIPART FLOW

Files above 5 MiB use 16 MiB parts. Current Uppy behavior sends parts of one file sequentially; no intra-file parallelism is claimed.

## RETRY/RESUME

Retries are bounded by 0/1000/3000/7000 ms, after which the UI exposes an explicit retry action. Uppy retains completed multipart work during its supported in-session recovery. Cross-reload recovery remains unverified pending the network-interruption gate.

## ABORT/CLEANUP

Cancellation aborts the known multipart upload and marks the session aborted. Verification failures check that no version references the exact key before exact-object deletion. No prefix deletion exists.

## FINALIZATION RUNTIME

`DocumentFinalizationService` provides the approved boundary: HEAD, size verification, minimal signature range, full streaming SHA-256, and atomic DB finalization. `maxDuration=300` is configured for the Node route, but the actual production runtime and 500 MiB GET duration are not benchmarked. No Worker was added.

## FILE VALIDATION

Client and server validate allowlisted MIME, matching extension, non-empty size, configurable maximum, actual R2 size, and file-type magic bytes. The first 4100 bytes are used for identification; the entire object is streamed separately only for integrity hashing.

## SHA-256

Node crypto computes SHA-256 incrementally without buffering the full object. Multipart ETag is stored separately and is never treated as SHA-256.

## VERSIONING

Every replacement receives a new opaque object key. The DB locks the document, increments the version in one transaction, keeps old versions, and returns the same version for repeated finalization of one session.

## DOWNLOAD

The route re-authenticates and authorizes document plus version before issuing an attachment URL valid for 60 seconds. It sets no-store and no-referrer response headers. Inline preview and public sharing are absent.

## ARCHIVE

Archive is logical and preserves documents, versions, object references, checksums, and relationships.

## UNIT TESTS

32/32 pass, including document metadata, dates, type/extension agreement, sizes, and centralized thresholds.

## DB TESTS

19/19 pass after a clean local database reset through T-0008.

## RLS TESTS

Anonymous denial, two-user isolation, foreign context rejection, immutable versions, atomic finalization, and idempotence pass.

## INTEGRATION TESTS

Local DB integration passes. Real R2 integration is blocked by missing approved bucket/credentials.

## E2E TESTS

The new document scenario passes on the production build. The full suite records 10/11 on its first run; the only failure is a pre-existing Contacts timeout that passes immediately when rerun alone. No reproducible regression remains.

## SECURITY TESTS

Local DB authorization and key/uploadId checks are covered. Expired/tampered real presigned URL, method mutation, R2 bucket privacy/token scope, and foreign real-upload tests remain blocked pending R2 access.

## ACCESSIBILITY

The document creation path has no serious or critical axe violation. Progress uses a live status region; errors use alert semantics; controls remain keyboard accessible and focus-visible.

## MOBILE

The Uppy form passes at 360 px with no horizontal overflow after responsive width and wrapping overrides.

## LARGE-FILE GATE

|    Size | Upload | Recovery | SHA-256 | Finalization | Download | Result |
| ------: | ------ | -------- | ------- | ------------ | -------- | ------ |
|   1 MiB | blocked | blocked | blocked | blocked | blocked | NOT RUN |
|   5 MiB | blocked | blocked | blocked | blocked | blocked | NOT RUN |
|  25 MiB | blocked | blocked | blocked | blocked | blocked | NOT RUN |
|  50 MiB | blocked | blocked | blocked | blocked | blocked | NOT RUN |
| 100 MiB | blocked | blocked | blocked | blocked | blocked | NOT RUN |
| 250 MiB | blocked | blocked | blocked | blocked | blocked | NOT RUN |
| 500 MiB | blocked | blocked | blocked | blocked | blocked | NOT RUN |

Only generated synthetic fixtures may be used when this gate is run.

## MEMORY/PERFORMANCE

The code streams instead of buffering. Browser/server memory, throughput, interruption behavior, part retry, HEAD/signature/hash/finalization durations are not measured without the real gate.

## BUILD

Typecheck passes, ESLint passes, and Next.js 16.3.3 production build passes with all five protected document API routes.

## T-0001 → T-0007 REGRESSIONS

Unit and DB suites pass. Full E2E is 10/11 plus a successful isolated rerun of the one timed-out Contacts scenario.

## FINAL SECRET/REAL-DATA/DIFF AUDIT

No real local resource/report is read into fixtures or added by T-0008. No credential value, presigned URL, public document URL, service-role key, Supabase Storage provider, Worker, or adjacent T-0009 feature is introduced. Final Git audit must still be repeated immediately before commit.

## KNOWN LIMITATIONS

Real R2, CORS, token scope, expiry/tampering, large-file reliability, production finalization runtime, and cross-reload recovery are unverified. There is no antivirus, preview, OCR, sharing, Worker, or purge UI by scope.

## RECOMMENDED PRODUCT LIMIT

Do not advertise an R2 document size yet. The architecture target/configuration is 500 MiB, but the recommended product limit remains unset until the largest fully validated size receives human approval.

## NEXT TICKET

Remain on T-0008. Do not start T-0009. Next action is to provision/approve a private EU R2 bucket, server token, exact CORS origins, and deployment runtime for the real gate.

# REAL R2 VALIDATION

## R2 ENVIRONMENT

| Variable | Status |
| --- | --- |
| `R2_ACCOUNT_ID` | MISSING |
| `R2_ACCESS_KEY_ID` | MISSING |
| `R2_SECRET_ACCESS_KEY` | MISSING |
| `R2_BUCKET_NAME` | MISSING |
| `R2_ENDPOINT` | MISSING |
| `DOCUMENT_MAX_FILE_SIZE_BYTES` | MISSING |

No value was printed, copied, logged, or committed. The gate stopped at environment validation.

## PREFLIGHT CONFIGURATION

| Control | Expected | Actual | Result |
| --- | --- | --- | --- |
| Private bucket | yes | unavailable | NOT RUN |
| Correct endpoint | yes | missing | BLOCKED |
| Restricted token | yes | missing | BLOCKED |
| Production CORS | restricted | unavailable | NOT RUN |
| Public listing | disabled | unavailable | NOT RUN |

Bucket existence, privacy, jurisdiction, token scope, public access, custom domains, CORS, allowed methods/headers, exposed ETag, and endpoint-to-bucket matching cannot be falsified without the approved R2 environment.

## SIZE MATRIX

|    Size | Upload | Parts | Upload Time | SHA-256 | Finalization | Download | Result |
| ------: | ------ | ----: | ----------: | ------: | -----------: | -------- | ------ |
|   1 MiB | NOT RUN | — | — | — | — | — | BLOCKED |
|   5 MiB | NOT RUN | — | — | — | — | — | BLOCKED |
|  25 MiB | NOT RUN | — | — | — | — | — | BLOCKED |
|  50 MiB | NOT RUN | — | — | — | — | — | BLOCKED |
| 100 MiB | NOT RUN | — | — | — | — | — | BLOCKED |
| 250 MiB | NOT RUN | — | — | — | — | — | BLOCKED |
| 500 MiB | NOT RUN | — | — | — | — | — | BLOCKED |

No measurements are inferred or invented.

## PUT TESTS

NOT RUN — missing R2 environment.

## MULTIPART TESTS

NOT RUN — missing R2 environment.

## NETWORK INTERRUPTION

NOT RUN — no authorized 250+ MiB R2 upload could be started.

## RETRY

NOT RUN against R2. The local implementation remains covered only by its internal checks.

## CANCEL / ABORT

NOT RUN against R2.

## ORPHAN CLEANUP

NOT RUN against R2. No synthetic remote object or multipart upload was created.

## SHA-256

NOT RUN against R2; no timing or memory claim is made.

## FINALIZATION PERFORMANCE

NOT RUN. The deployment runtime limit and 100/250/500 MiB finalization durations remain unknown. This is an environment blocker, not evidence of `FINALIZATION_RUNTIME_BLOCKED`.

## MEMORY

NOT RUN. Browser and server RSS were not measured.

## SIGNED URL SECURITY

NOT RUN. No legitimate, expired, modified-key, modified-method, modified-signature, or modified-query R2 URL was generated.

## CROSS-WORKSPACE SECURITY

Real R2 presigning/download attacks were NOT RUN. Existing local DB/RLS and storage-key-scope checks do not substitute for this external gate.

## FILE VALIDATION

Real-path valid/malformed PDF, PNG, JPEG, empty, mismatch, and oversized cases were NOT RUN. No real or local professional document was used.

## VERSIONING

Real-object v1/v2 preservation and old-version download were NOT RUN.

## CONCURRENCY

Concurrent real replacements were NOT RUN.

## DOWNLOAD

Authorized and foreign-user real downloads were NOT RUN.

## CORS

Approved-origin and unauthorized-origin browser checks were NOT RUN because no bucket configuration is available. No wildcard configuration was introduced.

## REGRESSIONS

Not rerun during this external gate because the mandatory environment preflight failed before integration activity. The preceding internal report remains the latest regression evidence.

## SECRET AUDIT

The environment check emitted statuses only. No secret value was read into the report, browser, logs, screenshots, or Git.

## CLEANUP

No local large fixture, R2 object, upload session, or multipart upload was created by this gate; therefore no destructive cleanup was necessary.

## RECOMMENDED PRODUCT LIMIT

Unset. Do not advertise 500 MiB or any real R2 document capacity until the complete size and recovery matrix passes.

## KNOWN LIMITATIONS

All external R2 configuration, security, reliability, performance, memory, recovery, cleanup, download, and CORS claims remain unverified.

## FINAL STATUS

`BLOCKED`

Blocker code: `BLOCKED_R2_ENVIRONMENT`.

T-0008 remains unapproved. T-0009 must not start.
