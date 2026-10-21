# Niramaya ? system overview

Niramaya is a prototype for supporting anaemia and oral screening conversations in primary health care settings. It is a **screening aid only, never a diagnosis**. Use clinician judgement and locally approved pathways; do not make care decisions from a demo estimate or a rule result.

## Portals and project layout

```text
.
??? src/
?   ??? main.jsx                    React Router entry, login, route guards, public self-check
?   ??? client/                     Mobile client portal and retained legacy demo flow
?   ??? admin/                      Service oversight, users, review, reports, master data
?   ??? shared/                     API/auth, role guard, i18n, IndexedDB queue, shared styles/types
?   ??? OralScreening.jsx            Existing oral questionnaire and rule-based triage
?   ??? oralTriage.js                Shared JS oral triage rules
?   ??? style.css                    Legacy demo styles
??? backend/
?   ??? app/main.py                  FastAPI routes, RBAC middleware, SQLite access
?   ??? app/security.py              bcrypt passwords and signed access/refresh tokens
?   ??? migrations/001_portal_schema.sql
?   ??? seed_demo.py                 Synthetic development users and records
?   ??? training/                    Research-only image feature extractor and trainer
?   ??? tests/                       API, auth, sync, feature and rule-contract tests
?   ??? requirements.txt
?   ??? Dockerfile
??? shared/oral_triage_cases.json    JS/Python shared triage cases
??? deploy/nginx.conf                SPA fallback and same-origin API proxy
??? Dockerfile                       Frontend build and Nginx runtime
??? docker-compose.yml               Frontend, API and persistent SQLite volume
??? .env.example
??? README.md
```

### Client portal

`/app/*` is for the authenticated health-worker role. It has a responsive home dashboard, consent-first two-step screening form, pseudonymous patient list and timeline, referral tracker with QR/print/read-aloud actions, learning cards, facility directory, announcements, follow-up reminders, settings, and the retained legacy demonstration screens. The new anaemia wizard records an illustrative workflow only; it does not calculate Hb. The oral wizard uses the existing rule-based triage code. Photos are not part of the new wizard.

Screening drafts stay in this browser. Completed records go to the API when online or to IndexedDB when offline. Sync retries use a stable client key; the API treats repeated keys idempotently. A village assignment is checked on the server. The client shows pending count and last successful sync. The service worker caches the app shell but bypasses `/api/` so authenticated health data is not written into Cache Storage.

A one-time local import is offered from Settings. Only legacy rows with an explicit consent field are eligible. Imported values are reduced to pseudonymous demo records; old Hb values and other measurements are discarded. Rows without consent are left in the old browser store for review or local deletion. The legacy anaemia and oral flows remain available during transition.

`/self-check` is public and does not call the API or save responses. It provides basic mouth-check and anaemia symptom information and directs people to clinical care. It is not a diagnostic tool.

### Admin portal

`/admin/*` is a separate desktop-first service-oversight portal for admin and superadmin roles. It includes an activity dashboard with date, village and screening-type filters; small-count reliability notes; user creation, disable and password reset; screening review, oral specialist outcome and lab reconciliation; referral status updates; village/facility management; CSV/print reports; announcements; audit log; and system settings. Image uploads default to disabled and may only be enabled by a superadmin who records a privacy review. Model uploads also require an explicit clinical review field.

The admin UI is a working prototype, not the full specification. Threshold editing/version approval, complete master-data workflows, multilingual announcement authoring/read-rate reports, backup/retention controls, robust report templates and operational analytics still need work.

## Local development

Requires Node.js 22 (or a compatible current Node release) and Python 3.11+.

```powershell
npm ci
npm run dev
```

In a second terminal, start the API and seed synthetic data:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:JWT_SECRET = python -c "import secrets; print(secrets.token_urlsafe(48))"
$env:APP_ENV = "development"
python seed_demo.py
uvicorn app.main:app --reload --port 8000
```

Vite proxies `/api` to `http://localhost:8000`. The seed script prints the development-only credentials. The demo accounts require a password change at first sign-in. Seed data is synthetic and labelled demo data; do not enter real patient records.

To run the three local containers, copy `.env.example` to `.env`, replace `JWT_SECRET` with a newly generated secret, then run:

```powershell
docker compose up --build
```

Open `http://localhost:5173`. The API is also exposed on port 8000 for local development. This HTTP setup is for localhost only. Any shared deployment needs HTTPS at a trusted reverse proxy, restricted network exposure, managed secrets and a security review. The compose setup uses SQLite on a persistent named volume; it is not a managed production database.

Demo usernames are `demo.worker`, `demo.admin` and `demo.superadmin`; the seed command prints the shared demo-only temporary password. Do not use these accounts outside development. To seed manually, run `python seed_demo.py` from `backend/` with `APP_ENV=development`.

## Authentication, roles and API routes

Passwords use bcrypt. Login returns a short-lived signed access token and a refresh token. The API checks roles on every `/api/*` route except health, public group-reference and authentication entry routes. Login has an in-memory per-IP throttle and per-account lockout after repeated failures. Tokens and session state are held in browser `sessionStorage`. Password changes and role changes are written to the audit log. API responses are marked `no-store`; the service worker never caches API responses.

| Role         | Access                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `client`     | Own client dashboard and patient/referral views; create consented screenings; sync only for assigned village; no admin APIs |
| `admin`      | Admin dashboards, reports, user and service data, review outcomes and audit log; cannot create/reset administrator accounts |
| `superadmin` | Admin access plus administrator account operations, model replacement and photo-upload setting                              |

| Route                                                                          | Access                                                                  | Purpose                                                                                                       |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `POST /api/auth/login`, `POST /api/auth/refresh`                               | Public credential/token check                                           | Sign in and refresh session                                                                                   |
| `GET /api/auth/me`, `POST /api/auth/change-password`                           | Authenticated                                                           | Session identity and forced password change                                                                   |
| `GET /api/health`, `GET /api/groups`                                           | Public                                                                  | Service status and reference groups (not clinical approval)                                                   |
| `GET /api/client/*`, `POST /api/sync`                                          | Client (some read views also admin)                                     | Client dashboard, pseudonymous patients, follow-ups, referrals, announcements, facilities and idempotent sync |
| `POST /api/oral/screen`                                                        | Client                                                                  | Consent-gated rule-based oral record                                                                          |
| `POST /api/quality`, `POST /api/screen`                                        | Client; photo setting must be enabled                                   | Optional legacy API image workflow; disabled by default                                                       |
| `/api/admin/*`                                                                 | Admin or superadmin; selected settings/model operations superadmin only | Users, analytics, facilities, review, reports, announcements, audit, settings                                 |
| `/api/logs*`, `/api/stats`, `/api/model`, `/api/oral/logs*`, `/api/oral/stats` | Admin or superadmin                                                     | Retained reference/legacy backend routes                                                                      |

All screening writes require consent. The sync schema accepts only pseudonymous patient code, village, age band, sex, screening type and bounded screening payload fields; it rejects extra fields. Photos are not stored. If a superadmin enables the explicit legacy photo setting after recording a review, image processing remains in memory and still does not persist the image.

## Database and offline sync

SQLite schema changes are in `backend/migrations/`; `schema_version` records the applied schema baseline. Tables include users, villages, facilities, patients, screenings, oral_screenings, referrals, follow_ups, lab_results, announcements, announcement_reads, audit_log, settings and sync receipts/keys. Existing `logs` and `oral_logs` are retained for the original reference API.

Each offline record has a random `client_key`. The client keeps it in IndexedDB and sends it in a batch after connectivity returns. The server enforces village assignment, validates consent and fields, and uses a unique key to make retries safe. The browser removes a queued item only after an accepted response. If the user is offline during startup, the last session identity is used to access the local queue; server data stays unavailable until online authentication succeeds.

## Clinical, legal and privacy limits

- The browser legacy Hb value is fixed fictional sample data. The new anaemia wizard records no estimate. The optional image heuristic and research trainer are not validated clinical methods.
- Oral screening is rule-based and demonstrative. Thresholds, referral zones, symptoms and rules need review against current WHO / NP-NCD guidance and local protocols. No accuracy claim is made.
- Demo records are synthetic. Pseudonymous codes are still sensitive health data. Do not use real people or identifiers in this prototype.
- The local prototype has no clinical governance process, full retention/deletion implementation, tested backups, production intrusion monitoring, signed deployment process, revocable refresh sessions, or external identity verification. Login throttling is in-process and does not replace a production rate limiter.
- SQLite and HTTP compose are local-development choices. HTTPS, secure deployment secrets, key rotation, access review, database backup and disaster recovery need deployment work.
- Offline IndexedDB and session storage are not encrypted by this app. Local device protection and a retention/deletion policy are required before operational use.
- Admin audit events record successful authenticated API access and changes, but this is not a tamper-proof audit system. No authentication package or application security review makes this production-ready.
- Model metadata cannot be loaded unless `clinically_reviewed` and a documented review note are supplied. That field is a gate in the prototype, not proof of clinical safety.

### Expert review required before any real use

- Current WHO and NP-NCD thresholds, local state protocols, referral criteria and triage rules.
- Consent, capacity, withdrawal, data-sharing and retention/deletion wording.
- DPDP Act 2023 applicability, state health-department data policies, hosting location, incident response and lawful processing basis.
- English, Hindi and Kannada clinical wording, including native-speaking clinician review. Current translations are partial and should not be treated as approved.
- Facility names, contact numbers, operating hours, directions and referral pathways.
- Security architecture, encryption at rest, device sharing, backups, retention schedules and account recovery.
- Any future model, image quality rule or clinical outcome metric must receive independent clinical and technical validation.

### Intentionally left out

Real SMS/WhatsApp delivery, ABDM linkage, production maps/geocoding, external identity provider, clinical diagnosis or treatment recommendations, automated patient reminders while the app is closed, fully featured PDF reporting, and production-grade account/session revocation are not included. The application must not be used to replace Hb testing, clinician judgement or local governance.

## Tests and checks

```powershell
npm test
npm run build
python -m pytest backend/tests -q
```

Frontend tests cover route guards, consent gating, IndexedDB queue behavior, language dictionary fallback and basic axe checks. Backend tests cover authentication, role enforcement, village scoping, sync idempotency, audit writes, consent and shared oral-rule cases. `npm audit` currently reports advisories in the development dependency tree; resolve and recheck before deployment.
