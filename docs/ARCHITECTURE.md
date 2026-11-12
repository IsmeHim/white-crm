# White Channel CRM V2.0 — System Architecture

## 1. Runtime Overview

- **`public/index.php`** — Single PHP entry point handling routing, web setup wizard, login page, and the single-page application shell.
- **`public/assets/app.js`** — Modern Vanilla JavaScript SPA interface with JSON API client, modal dialogues, responsive drawer navigation, and Gemini AI search bar integration.
- **`public/assets/app.css`** — Fully self-contained themeable design system supporting 3 themes (`Premium Navy`, `Classic Green`, `Dark Professional`); zero external CDN dependencies.
- **`app/bootstrap.php`** — Environment configuration, UTF-8 fallbacks, autoloader, session configuration, CSRF tokens, and security headers.
- **`app/Schema.php`** — Master schema definitions, field metadata, data types, validation rules, and summary transformers for all CRM collections.
- **`app/Store.php`** — High-performance SQLite3 persistence layer with Write-Ahead Logging (`WAL`), ACID-compliant immediate transactions, and automatic query cache invalidation.
- **`app/Auth.php`** — Argon2id password hashing, session-based authentication, role-based access control (RBAC), and brute-force login rate limiting.
- **`app/Api.php`** — RESTful JSON API handling CRUD operations, dashboard metrics, inventory journal entries, encrypted Gemini AI integration, file uploads, audit logging, and CSV exports.

---

## 2. Database & Storage Layer (`storage/`)

White Channel CRM V2 uses an embedded **SQLite3** database running in `WAL` mode:

- **`storage/crm.sqlite`**: The primary database file containing:
  - `records`: Full JSON documents with UUIDs, timestamps, soft-delete flags, and indexed fields.
  - `cache`: Fast in-database query cache invalidated atomically on any write operation.
  - `meta`: System configuration, cache invalidation tokens, and AI usage metrics.
- **`storage/crm.sqlite-wal` & `storage/crm.sqlite-shm`**: Write-Ahead Logging files enabling concurrent non-blocking reads and serialized atomic writes.
- **`storage/uploads/`**: Private file attachments (project covers, shipment proofs, receipt slips) stored outside the web document root with random UUID names and verified MIME types.
- **`storage/exports/`**: Temporary CSV export files generated on-demand.
- **`storage/locks/`**: Lightweight filesystem lock guards used for login brute-force throttling and streaming database backups.

### ACID Guarantees & Concurrency
- All multi-record mutations (such as creating a donation and updating donor statistics, or recording an inventory movement and adjusting lot stock) run inside `Store::transact()` with `BEGIN IMMEDIATE TRANSACTION`.
- Concurrent modifications utilize optimistic locking via `expected_version` checks to prevent race conditions.

---

## 3. Gemini AI Smart Search Integration

- **Dual-Transport HTTP Client**: The backend integrates with Google Gemini API via cURL or native PHP stream fallback (`file_get_contents` + `stream_context_create`), ensuring it works in all server environments without external dependencies.
- **Intelligent Fallback Cascade**:
  1. `gemini-3.5-flash-lite` (Primary — 500 free RPD)
  2. `gemini-3.1-flash-lite` (Backup 1 — 500 free RPD)
  3. `gemini-3.6-flash` (Backup 2)
  4. `gemini-2.5-flash` (Backup 3)
  5. `gemini-2.5-flash-lite` (Backup 4)
  6. `gemini-2.0-flash` (Backup 5)
- **Rate Limit & Quota Tracker**: Local quota tracker monitors daily usage (RPD) and per-minute usage (RPM/TPM) against Google AI Studio free tier limits with auto-reset at midnight.

---

## 4. API Endpoints

All client requests communicate via `public/index.php?api=<action>` with session authentication and CSRF token verification:

| Endpoint | Method | Description |
|---|---|---|
| `?api=session` | GET | Check current session and active user permissions |
| `?api=login` / `?api=logout` | POST | Authenticate or destroy session |
| `?api=schema` | GET | Retrieve schema metadata and navigation structures |
| `?api=summary` | GET | Aggregate metrics and chart data for Dashboard |
| `?api=module&module=<name>` | GET/POST | Paginated search list / Create new record |
| `?api=record&module=<name>&id=<id>` | GET/PUT/DELETE | Read record / Update record / Soft-delete record |
| `?api=options&module=<name>` | GET | Fast autocomplete search for dropdown selectors |
| `?api=inventory` | POST | Transactional stock journal (in/out/adjust) |
| `?api=users` | GET/POST/PUT | RBAC user management (Admin only) |
| `?api=audit` | GET | System audit trail log |
| `?api=export&module=<name>` | GET | Generate and download CSV export |
| `?api=upload` | POST | Secure multipart file upload |
| `?api=file&id=<id>` | GET | Authenticated private file streaming |
| `?api=change-password` | POST | User self-service password update |
| `?api=ai-search` | POST | Gemini AI natural language fuzzy search |
| `?api=ai-settings` | GET/POST | Gemini API configuration and quota management |
