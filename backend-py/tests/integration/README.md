# Integration tests

Bu testlar real PostgreSQL test bazasiga muhtoj. Agar baza mavjud bo'lmasa, **hammasi avtomatik o'tkazib yuboriladi** (skip), test pipeline'ni buzmaydi.

## Tez sozlash

```bash
# 1. PostgreSQL ishga tushiring (docker compose orqali)
cd backend-py
docker compose up -d postgres

# 2. Test bazasini yarating (bir martalik)
docker compose exec postgres psql -U hireup -d hireup -c "CREATE DATABASE hireup_test;"

# 3. Integration testlarni ishga tushiring
pytest tests/integration/ -v
```

## Boshqa baza ishlatish

```bash
export TEST_DATABASE_URL="postgresql+asyncpg://user:pass@host:5432/test_db"
pytest tests/integration/ -v
```

## Faqat integration testlarni ishga tushirish

```bash
pytest -m integration -v
```

## Faqat unit testlarni ishga tushirish (DB shart emas)

```bash
pytest -m "not integration" -v
```

## Test arxitekturasi

- **Session-scoped `_test_engine`** — schema bir marta yaratiladi, oxirida o'chiriladi
- **Auto-use `_reset_db_after_test`** — har testdan keyin barcha jadvallarni `TRUNCATE CASCADE`
- **Function-scoped `client`** — `get_db` dependency test session bilan override qilinadi
- **Helper fixtures** — `make_user`, `make_job`, `make_application`, `auth_headers`, `employer_headers`, `admin_headers`

## Phase 1 bug'larni verify qiluvchi testlar

- `test_auth_flow.py::test_register_ignores_admin_role` — **bug #2**
- `test_jobs_flow.py::test_get_single_job_does_not_increment_for_owner` — **bug #11**
- `test_applications_flow.py::test_BUG1_status_update_requires_job_ownership` — **bug #1 CRITICAL**
- `test_users_flow.py::test_save_job_toggle_atomic` — **bug #14**
- `test_users_flow.py::test_admin_user_list_never_exposes_password` — **bug #3**
