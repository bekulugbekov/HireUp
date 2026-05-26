# HireUp Database — Entity-Relationship Diagram

PostgreSQL schema generated from the SQLAlchemy 2.0 models in `app/models/`.
Created by Alembic migration `001_initial_schema.py`.

---

## High-level relationships

```
                         ┌─────────────────────────┐
                         │         users           │
                         │─────────────────────────│
                         │ id (PK, UUID)           │
                         │ full_name               │
                         │ email (UNIQUE)          │
                         │ password_hash           │
                         │ role (ENUM)             │
                         │ language (ENUM)         │
                         │ avatar, phone, telegram │
                         │ bio, title              │
                         │ created_at, updated_at  │
                         └─────────────────────────┘
                              │ 1
              ┌───────────────┼────────────────┬───────────────┬─────────────────┐
              │ N             │ N              │ N (sender)    │ N (receiver)    │ N
              ▼               ▼                ▼               ▼                 ▼
       ┌────────────┐ ┌──────────────┐ ┌──────────────────────┐ ┌──────────────────┐
       │   jobs     │ │ applications │ │      messages        │ │ refresh_tokens   │
       │────────────│ │──────────────│ │──────────────────────│ │──────────────────│
       │ id (PK)    │ │ id (PK)      │ │ id (PK)              │ │ id (PK)          │
       │ title      │ │ user_id (FK) │ │ sender_id (FK)       │ │ user_id (FK)     │
       │ company    │ │ job_id (FK)  │ │ receiver_id (FK)     │ │ token_hash       │
       │ category   │ │ resume       │ │ job_id (FK, NULL)    │ │ expires_at       │
       │ location   │ │ cover_letter │ │ content (max 2000)   │ │ revoked_at       │
       │ description│ │ phone        │ │ is_read              │ │ replaced_by_id   │
       │ salary_min │ │ telegram     │ │ CHECK sender≠receiver│ │ user_agent       │
       │ salary_max │ │ status (ENUM)│ │ CHECK content > 0    │ │ ip_address       │
       │ salary_ccy │ │ UNIQUE(u,j)  │ └──────────────────────┘ └──────────────────┘
       │ requirements TEXT[]            ▲
       │ skills    TEXT[]               │
       │ contact_phone                  │
       │ contact_telegram               │ N
       │ contact_website                │
       │ view_count                     │
       │ is_active                      │
       │ created_by (FK → users.id)     │
       │ search_vector (TSVECTOR, generated)
       └──┬─────────┘                   │
          │ 1                            │
          └──────────────► N ─────────── ┘
                          (applications.job_id)


       ┌──────────────────────────────┐
       │         saved_jobs           │  (junction table)
       │──────────────────────────────│
       │ user_id (FK → users.id) PK   │
       │ job_id  (FK → jobs.id)  PK   │
       │ saved_at                     │
       └──────────────────────────────┘
```

---

## Relationship matrix

| From | Cardinality | To | ON DELETE | Notes |
|---|---|---|---|---|
| users → jobs | 1..N | jobs.created_by | CASCADE | Delete user → delete jobs |
| users → applications | 1..N | applications.user_id | CASCADE | |
| jobs → applications | 1..N | applications.job_id | CASCADE | |
| users → sent_messages | 1..N | messages.sender_id | CASCADE | |
| users → received_messages | 1..N | messages.receiver_id | CASCADE | |
| jobs → messages | 0..N | messages.job_id | **SET NULL** | Job context can disappear; the message itself survives |
| users ↔ jobs (saved) | M..N | saved_jobs | CASCADE both sides | Composite PK (user_id, job_id) |
| users → refresh_tokens | 1..N | refresh_tokens.user_id | CASCADE | |
| refresh_tokens → refresh_tokens | 0..N | replaced_by_id | SET NULL | Rotation audit chain |

---

## Indexes

| Table | Index | Type | Purpose |
|---|---|---|---|
| users | uq_users_email | UNIQUE | Login + email-exists check |
| users | idx_users_role | btree | Admin filtering by role |
| jobs | idx_jobs_active_created | btree | Default listing `WHERE is_active ORDER BY created_at` |
| jobs | idx_jobs_category | btree | Filter by category |
| jobs | idx_jobs_created_by | btree | "My jobs" lookup |
| jobs | **idx_jobs_search_vector_gin** | GIN | Full-text search (replaces Mongo `$text`) |
| jobs | **idx_jobs_skills_gin** | GIN | `skills && ARRAY[...]` membership |
| jobs | **idx_jobs_location_trgm** | GIN trgm | `location ILIKE '%uzbek%'` made fast |
| applications | uq_applications_user_job | UNIQUE | One application per user per job |
| applications | idx_applications_job_created | btree | Employer-side listing |
| applications | idx_applications_user_created | btree | "My applications" |
| messages | **idx_messages_pair_created** | functional btree | Conversation lookup via LEAST/GREATEST pair |
| messages | **idx_messages_receiver_unread** | partial btree | Fast unread count |
| refresh_tokens | uq token_hash | UNIQUE | O(1) lookup |
| refresh_tokens | **idx_refresh_tokens_active_user** | partial btree | Active sessions per user |

---

## Constraints

| Constraint | Table | Rule | Why |
|---|---|---|---|
| `ck_users_email_lowercase` | users | `email = lower(email)` | Prevents case-variant duplicates at the DB layer |
| `ck_jobs_salary_min_non_negative` | jobs | `salary_min >= 0` | Sane numeric range |
| `ck_jobs_salary_max_non_negative` | jobs | `salary_max >= 0` | |
| `ck_jobs_view_count_non_negative` | jobs | `view_count >= 0` | |
| `ck_messages_no_self_message` | messages | `sender_id <> receiver_id` | Fixes Node.js bug where this was only checked in the controller |
| `ck_messages_content_non_empty` | messages | `length(trim(content)) > 0` | Empty messages rejected at the DB layer too |
| `uq_users_email` | users | UNIQUE(email) | |
| `uq_applications_user_job` | applications | UNIQUE(user_id, job_id) | Prevents double-apply via DB, not just app code |

---

## PostgreSQL ENUM types

| Name | Values |
|---|---|
| `user_role` | `user`, `employer`, `admin` |
| `lang_code` | `uz`, `ru`, `en` |
| `job_category` | `IT`, `Marketing`, `Design`, `Finance`, `Education`, `Healthcare`, `Engineering`, `Sales`, `Other` |
| `experience_level` | `no-experience`, `junior`, `mid`, `senior` |
| `job_type` | `full-time`, `part-time`, `remote`, `contract`, `internship` |
| `application_status` | `pending`, `reviewed`, `accepted`, `rejected` |

---

## Extensions required

- `pgcrypto` — provides `gen_random_uuid()` on PG < 13 (built-in on PG 13+, but installing is harmless and forward-compatible)
- `pg_trgm` — enables `gin_trgm_ops` for fast `ILIKE` searches

---

## What this design replaces from MongoDB

| Mongo pattern | Postgres equivalent | Improvement |
|---|---|---|
| `User.savedJobs[]` embedded array | `saved_jobs` junction table | Atomic toggle via `INSERT ON CONFLICT`; race-free |
| `Job.salary{}` embedded object | flat columns `salary_min/max/currency` | Easy to filter/index |
| `Job.contact{}` embedded object | flat `contact_*` columns | Same |
| `Job.requirements[]`, `Job.skills[]` | `TEXT[]` columns + GIN index | Native, queryable with `&&` |
| `$text` index | `tsvector` generated column + GIN | Standard, supports ranking |
| `$regex` ILIKE on location | `pg_trgm` GIN index | O(log n) instead of full scan |
| Mongo aggregation for conversations | `DISTINCT ON` + CTE | One round-trip, indexable |
| Cascade-less reference deletes | Explicit `ON DELETE` per FK | No orphaned rows |
| Implicit unique compound `{user, job}` | `UNIQUE` constraint | DB-enforced |
