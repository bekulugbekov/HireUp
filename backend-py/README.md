# HireUp — FastAPI Backend

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0_async-D71F00?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

**Production-ready REST API for a full-stack job platform.**  
Complete rewrite of the original Node.js/Express/MongoDB backend using modern async Python.

[🚀 Live API](https://hireup-fastapi.onrender.com) · [📖 Swagger UI](https://hireup-fastapi.onrender.com/api-docs) · [🌐 Frontend](https://hireup-job.netlify.app)

</div>

---

## Overview

HireUp is a multilingual job platform (Uzbek / Russian / English) where **job seekers** browse and apply for positions, **employers** post and manage listings, and **admins** oversee the entire platform.

This `backend-py/` directory is a ground-up rewrite of the original `backend/` (Node.js + Express + MongoDB) using the Python async stack. Both backends live side-by-side in the same repository so the architectural decisions can be compared directly.

**Why rewrite?**
During the migration audit, **25 bugs** were found in the original backend — including a critical authorization flaw that let any employer change another employer's application status. The rewrite fixed all 25 while adding full test coverage, refresh-token rotation, structured logging, and a production Docker setup.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | FastAPI 0.115 | Async-native, automatic OpenAPI, Pydantic-first |
| **Validation** | Pydantic v2 | Full type safety, camelCase ↔ snake_case aliases |
| **Config** | pydantic-settings | Validated env vars, fails loudly on startup |
| **Database** | PostgreSQL 16 | Full-text search (`pg_trgm`), UUIDs (`pgcrypto`), ACID |
| **ORM** | SQLAlchemy 2.0 async + asyncpg | Non-blocking DB calls, typed mapped columns |
| **Migrations** | Alembic | Schema versioning, auto-seeding |
| **Auth** | JWT (24 h) + Refresh tokens (30 d) | Rotation + reuse detection, family invalidation |
| **Password** | passlib bcrypt (12 rounds) | Industry-standard hashing |
| **Rate limiting** | slowapi | Per-IP, per-endpoint limits |
| **Logging** | structlog | JSON in production, colour console in dev, request_id per call |
| **File uploads** | python-multipart + python-magic | MIME-type validation, UUID-named storage |
| **i18n** | Custom `Translator` | `Accept-Language` header → uz / ru / en JSON locale |
| **Tests** | pytest + pytest-asyncio + httpx | 102 tests (54 unit + 48 integration) |
| **Container** | Multi-stage Dockerfile + docker-compose | Dev and prod profiles |
| **Reverse proxy** | Nginx | TLS termination, static `/uploads` serving |
| **CI/CD** | GitHub Actions | Test on PR → release image to GHCR on tag |
| **Deploy** | Render.com Blueprint | One-click: web service + managed PostgreSQL |

---

## Architecture

### Clean Architecture layers

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  Router  (app/api/v1/routers/)                      │
│  • Pydantic validation (input/output schemas)       │
│  • Dependency injection (auth, DB session, service) │
│  • No business logic                                │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Service  (app/services/)                           │
│  • Authorization checks ("can this user do this?") │
│  • Business rules and orchestration                 │
│  • Raises typed exceptions (NotFoundError, etc.)   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Repository  (app/repositories/)                    │
│  • SQLAlchemy async queries only                    │
│  • Zero business logic                              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  Model  (app/models/)                               │
│  • SQLAlchemy 2.0 declarative ORM                   │
│  • Typed mapped_column, relationships               │
└─────────────────────────────────────────────────────┘
```

### Exception flow

No router raises `HTTPException` directly. Services raise typed `AppError` subclasses (`NotFoundError`, `ForbiddenError`, `ConflictError`, `ValidationError`). A global exception handler converts them to i18n-localised `{ success, message }` responses — keeping routing and error presentation fully decoupled.

### Field naming convention

| Layer | Convention | Example |
|---|---|---|
| Python / Database | `snake_case` | `full_name`, `created_at` |
| API (JSON) | `camelCase` | `fullName`, `createdAt` |

Pydantic's `alias_generator=to_camel` + `populate_by_name=True` handles the mapping automatically in every schema.

---

## Project Structure

```
backend-py/
├── app/
│   ├── api/v1/
│   │   ├── deps.py              # DbSession, CurrentUser, require_roles, *ServiceDep
│   │   ├── router.py            # v1 router aggregator
│   │   └── routers/
│   │       ├── health.py        # GET /health, /health/ready
│   │       ├── auth.py          # register, login, refresh, logout, logout-all, me
│   │       ├── jobs.py          # 7 endpoints + 8 filter params
│   │       ├── applications.py  # apply (multipart), my, job/:id, status, withdraw
│   │       ├── users.py         # profile, password, saved, admin
│   │       └── messages.py      # send, conversations, thread, unread
│   ├── core/
│   │   ├── config.py            # Pydantic Settings — validated on startup
│   │   ├── exceptions.py        # AppError hierarchy
│   │   ├── i18n.py              # Translator + locale loading
│   │   ├── logging.py           # structlog configuration
│   │   ├── rate_limits.py       # Centralised limiter
│   │   └── security.py          # bcrypt + JWT + refresh token helpers
│   ├── db/
│   │   ├── base.py              # Base, UUIDPrimaryKeyMixin, TimestampMixin
│   │   └── session.py           # Async engine + get_db + pool tuning
│   ├── locales/                 # uz.json / ru.json / en.json (full message keys)
│   ├── middleware/
│   │   ├── body_size_limit.py   # 10 MB Content-Length cap
│   │   ├── request_id.py        # X-Request-ID header injection
│   │   └── security_headers.py  # Helmet equivalent (CSP, HSTS, X-Frame, …)
│   ├── models/                  # User, Job, Application, Message, SavedJob, RefreshToken + enums
│   ├── repositories/            # Data access layer (7 repos + BaseRepository)
│   ├── schemas/                 # Pydantic I/O schemas with camelCase aliases
│   ├── services/                # AuthService, JobService, ApplicationService,
│   │                            # UserService, MessageService
│   ├── utils/
│   │   ├── file_upload.py       # UUID filenames + MIME validation
│   │   ├── pagination.py        # Shared paginator helper
│   │   ├── router.py            # CamelCaseRouter (auto by_alias on responses)
│   │   └── serialization.py     # ORM → camelCase nested dict (no lazy-load)
│   └── main.py                  # FastAPI factory + 7 middleware layers
├── alembic/versions/
│   ├── 001_initial_schema.py    # pgcrypto, pg_trgm, 6 ENUMs, 6 tables, 11 indexes
│   └── 002_seed_admin_user.py   # Default admin user (idempotent ON CONFLICT DO NOTHING)
├── docker/
│   ├── entrypoint.sh            # alembic upgrade head → gunicorn (fail-fast)
│   ├── gunicorn_conf.py         # UvicornWorker, max_requests rotation
│   ├── healthcheck.py           # Container HEALTHCHECK script
│   └── nginx.conf               # TLS + static /uploads
├── docs/
│   ├── DEPLOY.md                # 3 deployment options
│   ├── ERD.md                   # Database entity-relationship diagram
│   ├── FRONTEND_MIGRATION.md    # Frontend cheat sheet (what changed for the React app)
│   ├── FUTURE_IMPROVEMENTS.md   # Roadmap
│   └── MIGRATION_REPORT.md      # Full 25-bug audit + 10-phase summary
├── tests/
│   ├── test_*.py                # 54 unit tests (no DB required)
│   └── integration/             # 48 integration tests (real PostgreSQL)
│       ├── conftest.py          # Async engine + autouse TRUNCATE + 9 fixtures
│       ├── test_auth_flow.py
│       ├── test_jobs_flow.py
│       ├── test_applications_flow.py
│       ├── test_users_flow.py
│       └── test_messages_flow.py
├── requirements/
│   ├── base.txt
│   └── dev.txt
├── Dockerfile                   # Multi-stage (builder → runtime), non-root user
├── docker-compose.yml           # Dev: api + postgres
├── docker-compose.prod.yml      # Prod overlay: + nginx, no exposed DB ports
├── pyproject.toml               # ruff + mypy + pytest config
└── render.yaml                  # Render.com Blueprint (web service + managed DB)
```

---

## API Endpoints

| Module | Method | Path | Auth | Description |
|---|---|---|---|---|
| **Health** | GET | `/api/health` | — | Liveness probe |
| | GET | `/api/health/ready` | — | Readiness probe (DB ping) |
| **Auth** | POST | `/api/auth/register` | — | Register (role always `user`) |
| | POST | `/api/auth/login` | — | Login → access + refresh tokens |
| | POST | `/api/auth/refresh` | — | Rotate refresh token |
| | POST | `/api/auth/logout` | JWT | Revoke current refresh token |
| | POST | `/api/auth/logout-all` | JWT | Revoke all sessions (family) |
| | GET | `/api/auth/me` | JWT | Current user profile + saved jobs |
| **Jobs** | GET | `/api/jobs` | — | List with 8 filters + pagination |
| | GET | `/api/jobs/my` | Employer/Admin | My posted jobs |
| | GET | `/api/jobs/:id` | — | Detail (view counter, owner excluded) |
| | POST | `/api/jobs` | Employer/Admin | Create listing |
| | PUT | `/api/jobs/:id` | Owner/Admin | Update listing |
| | DELETE | `/api/jobs/:id` | Owner/Admin | Delete listing |
| | PATCH | `/api/jobs/:id/toggle` | Owner/Admin | Toggle active/inactive |
| **Applications** | POST | `/api/applications/:jobId` | User | Apply (multipart/form-data + resume) |
| | GET | `/api/applications/my` | User | My applications |
| | GET | `/api/applications/job/:id` | Employer/Admin | Applications for a job |
| | PATCH | `/api/applications/:id/status` | Employer/Admin | Accept / Reject |
| | DELETE | `/api/applications/:id` | User | Withdraw (pending only) |
| **Users** | PUT | `/api/users/profile` | JWT | Update profile |
| | PATCH | `/api/users/change-password` | JWT | Change password |
| | POST | `/api/users/saved/:id` | User | Toggle saved job |
| | GET | `/api/users/saved` | User | List saved jobs |
| | GET | `/api/users` | Admin | List all users (paginated) |
| | GET | `/api/users/stats` | Admin | Platform statistics |
| | DELETE | `/api/users/:id` | Admin | Delete user |
| **Messages** | POST | `/api/messages` | JWT | Send message |
| | GET | `/api/messages` | JWT | Conversation list |
| | GET | `/api/messages/unread` | JWT | Unread count |
| | GET | `/api/messages/:userId` | JWT | Thread with a user |

Response envelope: `{ "success": true, "message": "...", "data": {...}, "pagination": {...} }`

---

## Security

| Concern | Implementation |
|---|---|
| **Password storage** | bcrypt with 12 rounds (passlib) |
| **Authentication** | Short-lived JWT (24 h) + rotating refresh tokens (30 d) |
| **Refresh token reuse** | Family-based detection — reuse invalidates all sessions for that user |
| **Privilege escalation** | `role` field stripped from register payload at schema level; registration always produces `role=user` |
| **Authorization** | `require_roles()` dependency on every protected route; service layer double-checks ownership |
| **Input validation** | Pydantic v2 strict types reject malformed input before any DB access |
| **SQL injection** | SQLAlchemy parameterised queries only — no raw string interpolation in queries |
| **Rate limiting** | Global 100 req/min per IP; login 5/min, register 3/min |
| **Body size limit** | 10 MB JSON/form cap via ASGI middleware |
| **Security headers** | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` |
| **CORS** | Explicit allow-list (no wildcard in production) |
| **Trusted hosts** | `TrustedHostMiddleware` guards against Host-header injection |
| **Request tracing** | `X-Request-ID` injected on every response for log correlation |

---

## Notable Bug Fixes (from original Node.js backend)

25 bugs were found during the migration audit. The three most critical:

| # | Severity | Bug | Fix |
|---|---|---|---|
| 1 | 🔴 Critical | Any employer could change **any** application's status (missing ownership check) | `application.job.created_by == actor.id` verified in `ApplicationService.update_status()` |
| 2 | 🔴 Critical | Anyone could self-register as `admin` by sending `role=admin` in the request body | `role` field removed from `RegisterPayload` schema entirely |
| 3 | 🔴 Critical | `/api/users` admin list returned `passwordHash` in the response | Serializer explicitly excludes all password fields |

All 25 are documented with test coverage in [docs/MIGRATION_REPORT.md](docs/MIGRATION_REPORT.md).

---

## Quick Start

### With Docker (recommended)

```bash
git clone https://github.com/bekulugbekov/HireUp.git
cd HireUp/backend-py

cp .env.example .env
docker compose up --build

# Verify
curl http://localhost:8000/api/health
# → {"status":"OK","env":"development"}

# Swagger UI
open http://localhost:8000/api-docs
```

### Without Docker

```bash
cd backend-py

python3.12 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

pip install -r requirements/dev.txt
cp .env.example .env
# Edit .env — set your local PostgreSQL credentials

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Environment variables

| Variable | Required | Example | Description |
|---|---|---|---|
| `DATABASE_URL` | prod only | `postgresql://...` | Overrides individual POSTGRES_* vars |
| `POSTGRES_HOST` | dev | `localhost` | |
| `POSTGRES_USER` | dev | `hireup` | |
| `POSTGRES_PASSWORD` | dev | `secret` | |
| `POSTGRES_DB` | dev | `hireup` | |
| `JWT_SECRET` | **yes** | 32+ chars | Token signing key |
| `CORS_ORIGINS` | **yes** | `https://app.example.com` | Comma-separated or JSON array |
| `TRUSTED_HOSTS` | prod | `api.example.com` | Comma-separated or JSON array |
| `BCRYPT_ROUNDS` | no | `12` | Default: 12 |
| `GUNICORN_WORKERS` | no | `1` | Default: `cpu * 2 + 1` |

See [`.env.example`](.env.example) and [`.env.production.example`](.env.production.example) for full lists.

---

## Running Tests

```bash
# Unit tests — no database required (~54 tests)
pytest -m "not integration" -v

# Integration tests — requires PostgreSQL (~48 tests)
docker compose up -d postgres
psql -U hireup -d hireup -c "CREATE DATABASE hireup_test;"
pytest -m integration -v

# All tests + coverage report
pytest --cov=app --cov-report=term-missing -v
```

Integration tests use a real PostgreSQL database and truncate all tables between tests — no mocking, no false negatives.

---

## Deployment

### Option 1 — Render.com (one click)

1. Fork this repo
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Point at your fork, set **Blueprint Path** to `backend-py/render.yaml`
4. Click **Apply** — Render provisions the web service + managed PostgreSQL automatically

### Option 2 — VPS with Docker Compose

```bash
# On your server
git clone https://github.com/bekulugbekov/HireUp.git
cd HireUp/backend-py
cp .env.production.example .env.production
# Fill in .env.production

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Nginx handles TLS (configure certbot separately) and serves `/uploads` as static files.

### Option 3 — CI/CD release

```bash
git tag backend-py-v1.0.0
git push origin backend-py-v1.0.0
# → GitHub Actions builds multi-arch Docker image → pushes to GHCR
```

See [docs/DEPLOY.md](docs/DEPLOY.md) for full instructions.

---

## Useful Commands

```bash
# Linting and formatting
ruff check app tests
ruff format app tests

# Type checking
mypy app

# Alembic migrations
alembic revision --autogenerate -m "add foo column"
alembic upgrade head
alembic downgrade -1

# Build and test the production image locally
docker build -t hireup-backend:test .
docker run -p 8000:8000 --env-file .env hireup-backend:test
```

---

## Compatibility with the Original Node.js Backend

The API contract is preserved so the React frontend required **zero changes** to work with the new backend:

| Contract | Status |
|---|---|
| URL paths | ✅ Identical |
| HTTP methods and status codes | ✅ Identical |
| camelCase field names | ✅ Identical |
| Response envelope `{success, message, data, pagination}` | ✅ Identical |
| `Authorization: Bearer ...` header | ✅ Identical |
| `Accept-Language` header (`uz` / `ru` / `en`) | ✅ Identical |
| `_id` field (returned as UUID string) | ✅ Identical |
| `refreshToken` in login/register response | 🆕 Added |
| `/api/auth/refresh`, `/logout`, `/logout-all` | 🆕 Added |
| `pagination` object on every list response | 🆕 Added |

---

## Documentation

| Document | Description |
|---|---|
| [docs/MIGRATION_REPORT.md](docs/MIGRATION_REPORT.md) | Full 10-phase migration report + 25 bug audit |
| [docs/ERD.md](docs/ERD.md) | Database entity-relationship diagram |
| [docs/FRONTEND_MIGRATION.md](docs/FRONTEND_MIGRATION.md) | What changed for the React frontend |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Step-by-step deployment guide (3 options) |
| [docs/FUTURE_IMPROVEMENTS.md](docs/FUTURE_IMPROVEMENTS.md) | Roadmap and planned enhancements |

---

## Author

**Bekhzod Ukulubekov** — [github.com/bekulugbekov](https://github.com/bekulugbekov)

> This project is part of a portfolio demonstrating a complete backend migration from Node.js/Express/MongoDB to Python/FastAPI/PostgreSQL — covering architecture design, security hardening, test coverage, and production deployment.
