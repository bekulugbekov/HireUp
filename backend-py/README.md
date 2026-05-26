# HireUp — FastAPI Backend (`backend-py/`)

Eski `backend/` (Node.js + Express + MongoDB) backendning **Python 3.12 + FastAPI + PostgreSQL 16** versiyasi. Eski papka o'zgartirilmagan — ikkala backend yonma-yon yashashi va solishtirilishi mumkin.

> ✅ **Holat:** Migratsiya yakunlandi. Barcha 10 ta phase tugadi. 24 ta endpoint 1:1 ko'chirilgan + 3 ta yangi auth endpoint qo'shilgan. Production deploy uchun tayyor.

📋 **To'liq migratsiya hisoboti:** [docs/MIGRATION_REPORT.md](docs/MIGRATION_REPORT.md)
🚀 **Deploy qo'llanmasi:** [docs/DEPLOY.md](docs/DEPLOY.md)
🗺️ **Database ERD:** [docs/ERD.md](docs/ERD.md)
🔌 **Frontend cheat sheet:** [docs/FRONTEND_MIGRATION.md](docs/FRONTEND_MIGRATION.md)
🛣️ **Kelajak yaxshilanishlar:** [docs/FUTURE_IMPROVEMENTS.md](docs/FUTURE_IMPROVEMENTS.md)

---

## Texnologiyalar

| Sloy | Texnologiya |
|---|---|
| Web framework | FastAPI 0.115 |
| Validatsiya | Pydantic v2 (camelCase API ↔ snake_case Python) |
| Config | Pydantic Settings (env tekshiruvi boot'da) |
| Ma'lumotlar bazasi | PostgreSQL 16 + SQLAlchemy 2.0 async + asyncpg |
| Migratsiyalar | Alembic |
| Auth | JWT (24h) + Refresh token rotation (30 days) + reuse detection |
| Parol | passlib[bcrypt] (12 round) |
| Fayl yuklash | python-multipart + python-magic (MIME validatsiya) |
| Rate limiting | slowapi (per-endpoint) |
| Logging | structlog (JSON prod, console dev, request_id) |
| Hujjatlash | OpenAPI 3 + Swagger UI (`/api-docs`) |
| Testlar | pytest + pytest-asyncio + httpx (~102 test) |
| Konteyner | Multi-stage Dockerfile + docker-compose (dev + prod) |
| Reverse proxy | Nginx (prod) — TLS + static /uploads |
| CI/CD | GitHub Actions (test + release to GHCR) |
| Deploy | Render.com blueprint + VPS docker-compose |

---

## Loyiha tuzilishi

```
backend-py/
├── app/
│   ├── api/v1/
│   │   ├── deps.py              # DbSession, T, CurrentUser, require_roles, *ServiceDep
│   │   ├── router.py            # v1 router agregatori
│   │   └── routers/
│   │       ├── health.py        # /api/health + /api/health/ready
│   │       ├── auth.py          # register, login, refresh, logout, logout-all, me
│   │       ├── jobs.py          # 7 endpoint + 8 filtrlar
│   │       ├── applications.py  # apply (multipart), my, job/:id, status, withdraw
│   │       ├── users.py         # profile, password, saved, admin
│   │       └── messages.py      # send, conversations, thread, unread
│   ├── core/
│   │   ├── config.py            # Pydantic Settings
│   │   ├── exceptions.py        # AppError ierarxiyasi
│   │   ├── i18n.py              # Translator + locale yuklash
│   │   ├── logging.py           # structlog sozlash
│   │   ├── rate_limits.py       # Markazlashgan limiter
│   │   └── security.py          # bcrypt + JWT + refresh helpers
│   ├── db/
│   │   ├── base.py              # Base, UUID/Timestamp mixin
│   │   └── session.py           # async engine + get_db + pool tuning
│   ├── locales/                 # uz/ru/en JSON (to'liq, message.* hammada bor)
│   ├── middleware/
│   │   ├── body_size_limit.py   # 10 MB Content-Length cap
│   │   ├── request_id.py        # X-Request-ID
│   │   └── security_headers.py  # Helmet ekvivalenti
│   ├── models/                  # User, Job, Application, Message, SavedJob, RefreshToken + enums
│   ├── repositories/            # Data access (7 ta + base)
│   ├── schemas/                 # Pydantic input/output (camelCase aliasli)
│   ├── services/                # AuthService, JobService, ApplicationService, UserService, MessageService
│   ├── utils/
│   │   ├── file_upload.py       # UUID nomi + MIME validatsiya
│   │   ├── pagination.py
│   │   ├── router.py            # CamelRouter (auto by_alias)
│   │   └── serialization.py     # ORM → camelCase nested dict
│   └── main.py                  # FastAPI factory + 7 middleware
├── alembic/
│   └── versions/
│       └── 001_initial_schema.py  # pgcrypto, pg_trgm, 6 ENUM, 6 jadval, 11 indeks
├── docker/
│   ├── Dockerfile               # ../Dockerfile
│   ├── entrypoint.sh            # alembic upgrade head + gunicorn
│   ├── gunicorn_conf.py         # cpu*2+1 workers, max_requests rotation
│   ├── healthcheck.py           # Container HEALTHCHECK
│   └── nginx.conf               # Prod reverse proxy + TLS + static /uploads
├── docs/
│   ├── DEPLOY.md                # 3 ta deploy yo'l
│   ├── ERD.md                   # Database diagrammasi
│   ├── FRONTEND_MIGRATION.md    # Frontend cheat sheet
│   ├── FUTURE_IMPROVEMENTS.md   # Roadmap
│   └── MIGRATION_REPORT.md      # To'liq hisobot
├── tests/
│   ├── conftest.py              # Test env + default client fixture
│   ├── test_*.py                # Unit testlar (54 ta)
│   └── integration/
│       ├── conftest.py          # DB engine + autouse TRUNCATE + 9 fixture
│       ├── test_auth_flow.py    # 11 test
│       ├── test_jobs_flow.py    # 11 test
│       ├── test_applications_flow.py  # 10 test (bug #1 verify)
│       ├── test_users_flow.py   # 9 test (bug #3, #14 verify)
│       ├── test_messages_flow.py  # 7 test
│       └── README.md
├── requirements/
│   ├── base.txt
│   └── dev.txt
├── uploads/                     # .gitkeep
├── .env.example                 # Dev template
├── .env.production.example      # Prod template
├── .gitignore
├── .dockerignore
├── alembic.ini
├── docker-compose.yml           # Dev: api + postgres
├── docker-compose.prod.yml      # Prod overlay: + nginx, no exposed ports
├── Dockerfile                   # Multi-stage + HEALTHCHECK + ENTRYPOINT
├── pyproject.toml               # ruff + mypy + pytest sozlamalari
├── render.yaml                  # Render.com blueprint
└── README.md                    # ushbu fayl
```

---

## Tez ishga tushirish

### Docker bilan (eng oson)

```bash
cd backend-py
cp .env.example .env
docker compose up --build

# Tekshirish
curl http://localhost:8000/api/health
# → {"status":"OK","timestamp":"..."}

# Swagger
open http://localhost:8000/api-docs
```

### Lokal (Docker'siz)

```bash
python3.12 -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\activate           # Windows

pip install -r requirements/dev.txt
cp .env.example .env
# PostgreSQL'ni o'zingiz ishga tushiring

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

---

## Testlar

```bash
# Unit testlar (DB shart emas) — ~54 test
pytest -m "not integration" -v

# Integration testlar (PostgreSQL kerak) — ~48 test
docker compose up -d postgres
docker compose exec postgres psql -U hireup -d hireup -c "CREATE DATABASE hireup_test;"
pytest -m integration -v

# Hammasi + coverage
pytest --cov=app --cov-report=term-missing -v
```

Batafsil: [tests/integration/README.md](tests/integration/README.md)

---

## API hujjatlari

Server ishga tushgandan keyin:

- **Swagger UI:** http://localhost:8000/api-docs
- **ReDoc:** http://localhost:8000/api/redoc
- **OpenAPI JSON:** http://localhost:8000/api/openapi.json

---

## Endpoint xulosa (24 + 3)

| Modul | Endpointlar | Auth |
|---|---|---|
| Auth | POST /register, /login, /refresh 🆕, /logout 🆕, /logout-all 🆕; GET /me | mixed |
| Jobs | GET /, /my, /:id; POST /; PUT /:id; DELETE /:id; PATCH /:id/toggle | mixed |
| Applications | GET /my, /job/:id; POST /:jobId; PATCH /:id/status; DELETE /:id | JWT |
| Users | PUT /profile; PATCH /change-password; POST /saved/:id; GET /saved, /, /stats; DELETE /:id | mixed |
| Messages | POST /; GET /, /unread, /:userId | JWT |
| Health | GET /health, /health/ready 🆕 | — |

To'liq tafsilot: [docs/MIGRATION_REPORT.md](docs/MIGRATION_REPORT.md) §3

---

## Arxitektura prinsiplari

### Clean Architecture
```
Router (HTTP)  →  Service (biznes mantiq)  →  Repository (DB)  →  Model
```

- **Router** — yupqa. Pydantic validatsiya, dependency injection, servisni chaqirish.
- **Service** — kim nimaga huquqi bor, biznes qoidalar, transactionlar.
- **Repository** — faqat SQLAlchemy so'rovlari, biznes mantiqsiz.
- **Model** — SQLAlchemy 2.0 declarative ORM.

### Exception oqimi

Hech bir router `HTTPException` qaytarmaydi. Service `AppError`'ning bir variantini ko'taradi (`NotFoundError`, `ForbiddenError`, `ConflictError`, ...) va global handler uni i18n bilan `{success, message}` formatiga aylantiradi.

### Field nomlash

- **Database / Python:** `snake_case` (`full_name`, `created_at`)
- **API request/response:** `camelCase` (`fullName`, `createdAt`)
- Pydantic `alias_generator=to_camel` orqali avtomatik tarjima.

### i18n

`Accept-Language` header'dan til olinadi (`uz` / `ru` / `en`). Har bir route'da `t: Translator = Depends(get_translator)` dependency mavjud. JSON fayllar `app/locales/`'da.

---

## Production deploy

3 ta variant — [docs/DEPLOY.md](docs/DEPLOY.md) batafsil:

1. **Render.com** (eng oson) — `render.yaml` blueprint
2. **VPS + Docker Compose** — `docker-compose.prod.yml` + Nginx + Let's Encrypt
3. **CI/CD release** — `git tag backend-py-v1.0.0` → GHCR'ga avtomatik push

---

## Eski Node.js bilan moslik

✅ URL pathlar bir xil
✅ HTTP method/status bir xil
✅ Request/response field nomlari camelCase
✅ Envelope: `{success, message, data, pagination}`
✅ Auth: `Authorization: Bearer ...`
✅ `Accept-Language` header
✅ `_id` field (UUID string sifatida)

🆕 **Qo'shimcha** (eski frontend buzilmaydi):
- `refreshToken` field login/register javobida
- `/api/auth/refresh`, `/logout`, `/logout-all` endpointlari
- `pagination` har list endpoint'da

To'liq frontend cheat sheet: [docs/FRONTEND_MIGRATION.md](docs/FRONTEND_MIGRATION.md)

---

## Foydali buyruqlar

```bash
# Lint + format
ruff check app tests
ruff format app tests

# Type check
mypy app

# Migratsiyalar
alembic revision --autogenerate -m "describe change"
alembic upgrade head
alembic downgrade -1

# Production image build (lokal sinov)
docker build -t hireup-backend:test .
docker run -p 8000:8000 --env-file .env hireup-backend:test
```

---

## Phase 1 bug'lari — barchasi tuzatildi

Eski Node.js backend'da topilgan 25 ta nuqson migratsiya paytida jimgina tuzatildi. To'liq ro'yxat va qaerda tuzatilgani: [docs/MIGRATION_REPORT.md](docs/MIGRATION_REPORT.md) §4.

Asosiy ahamiyatga ega tuzatishlar:
- 🔴 **Bug #1** — ariza statusini begona employer o'zgartira olardi → integration test bilan tasdiqlangan
- 🔴 **Bug #2** — har kim `role=admin` bilan ro'yxatdan o'tib admin bo'lardi → schema field yo'q
- 🔴 **Bug #3** — `/api/users` admin endpoint parol hash qaytarardi → serializer'da yo'q

---

## Litsenziya va mualliflik

Loyiha — `HireUp` portfel loyihasi qismi. Eski Node.js backend va ushbu Python ko'chirilishi bir xil egaga tegishli.

**Migratsiya:** 2026 — barcha 10 phase yakunlangan. To'liq xulosa: [MIGRATION_REPORT.md](docs/MIGRATION_REPORT.md).
