# Kelajak yaxshilanishlar Roadmap

Bu hujjat HireUp FastAPI backendni keyingi versiyalarda kengaytirish uchun tavsiyalar. Hozircha **hech qaysisi shart emas** — joriy holat to'liq ishlaydi.

---

## Prioritet 1 — Yaqin kelajak (1-3 oy)

### 📧 Email verification + Password reset

**Sabab:** Real foydalanuvchilar bilan ishlaganda spam akkountlar va parolni unutish muqarrar.

**Talab qilinadi:**
- `aiosmtplib` paketi (yoki SendGrid/Mailgun API)
- `email_verifications` jadval: `user_id, token_hash, expires_at, verified_at`
- `password_resets` jadval: `user_id, token_hash, expires_at, used_at`
- 3 ta yangi endpoint:
  - `POST /api/auth/verify-email` (token bilan)
  - `POST /api/auth/forgot-password` (email yuborish)
  - `POST /api/auth/reset-password` (token + yangi parol)
- Email template'lar (HTML + plaintext)
- `User.is_email_verified` boolean field

**Taxminiy vaqt:** 1-2 kun

---

### 📊 Prometheus metrics

**Sabab:** Production monitoring uchun.

**Talab qilinadi:**
- `prometheus_fastapi_instrumentator` paketi
- `/metrics` endpoint (faqat ichki network'dan)
- Custom metrics: login muvaffaqiyat/muvaffaqiyatsizlik, refresh reuse, response time per route
- Grafana dashboard JSON

**Taxminiy vaqt:** 0.5 kun

---

### 🗄️ Soft delete

**Sabab:** Foydalanuvchilar/vakansiyalar tasodifan o'chirilsa, qaytarib olish imkoni.

**Talab qilinadi:**
- Har asosiy jadvalga `deleted_at TIMESTAMPTZ NULL`
- Repository'larda default `WHERE deleted_at IS NULL`
- Admin uchun "trash" view + restore endpoint
- DELETE endpointlari soft delete ishlatadi

**Taxminiy vaqt:** 1 kun

---

### 🔍 Per-user rate limiting

**Sabab:** Hozir IP bo'yicha. NAT orqasidagi foydalanuvchilar bir-birini bloklashi mumkin.

**Talab qilinadi:**
- slowapi custom key function: token bo'lsa `user_id`, yo'qsa IP
- Login attempt tracking (user_id + IP)

**Taxminiy vaqt:** 0.5 kun

---

## Prioritet 2 — O'rta muddat (3-6 oy)

### ☁️ S3-compatible file storage

**Sabab:** Lokal disk skale qilmaydi va backup qiyin.

**Talab qilinadi:**
- `Storage` Protocol klassi (interface)
- `LocalStorage` (joriy) va `S3Storage` (yangi) implementatsiya
- `boto3[asyncio]` yoki `aioboto3` paketi
- Presigned URL generatsiya (resume xavfsizligi uchun)
- Dev'da MinIO container
- Prod'da AWS S3 / Cloudflare R2

**Taxminiy vaqt:** 2-3 kun

---

### 🔌 WebSocket real-time messages

**Sabab:** Hozir messages polling orqali keladi. WebSocket bilan jonli chat.

**Talab qilinadi:**
- FastAPI WebSocket router: `WS /ws/messages`
- Connection manager (per-user channels)
- Redis pub/sub multi-instance uchun
- Frontend `WebSocket` API ishlatadi
- Polling fallback (eski clientlar uchun)

**Taxminiy vaqt:** 3-4 kun

---

### 🔐 OAuth (Google + Telegram)

**Sabab:** Ko'p foydalanuvchi parol kiritmasdan kirishni xohlaydi.

**Talab qilinadi:**
- `authlib` paketi
- `oauth_accounts` jadval (provider, provider_user_id, user_id)
- Google: `/api/auth/google/login` + callback
- Telegram: WebApp data validation (HMAC)
- Account merging logikasi (mavjud email bilan)

**Taxminiy vaqt:** 2-3 kun

---

### 📦 Redis caching

**Sabab:** Hot job listlari va session storage uchun.

**Talab qilinadi:**
- `redis[hiredis]` paketi (async)
- `RedisCacheService` (get/set/delete)
- Job list cache (5 daqiqalik TTL)
- Distributed rate limiter (memory'dan Redis'ga)
- Refresh token revocation list cache

**Taxminiy vaqt:** 1-2 kun

---

### 🤖 Background tasks

**Sabab:** Email yuborish, notification push request thread'ini bloklamasligi kerak.

**Talab qilinadi:**
- Celery yoki RQ + Redis broker
- `app/tasks/` papkasi
- Worker container `docker-compose.yml`'da
- Misol task'lar: email yuborish, image thumbnail, application notification

**Taxminiy vaqt:** 2 kun

---

## Prioritet 3 — Uzoq muddat (6+ oy)

### 🔍 Elasticsearch / Meilisearch

**Sabab:** PG `tsvector` 1M+ vakansiya'da yetmasligi mumkin.

**Talab qilinadi:**
- Meilisearch container (Elasticsearch'dan engilroq)
- Sync flow: job CRUD → Meilisearch index update
- Search endpoint Meilisearch'ga proxy

**Taxminiy vaqt:** 3-5 kun

---

### 📱 GraphQL endpoint

**Sabab:** Mobile app fixed REST shapes yuklasa, GraphQL bilan over-fetch yo'q bo'ladi.

**Talab qilinadi:**
- `strawberry-graphql` paketi
- `/api/graphql` endpoint
- REST'ni saqlash (BC uchun)
- DataLoader pattern (N+1 oldini olish)

**Taxminiy vaqt:** 5-7 kun

---

### 🏢 Multi-tenancy

**Sabab:** Kompaniyalar uchun alohida workspace (har biriga o'z admin paneli).

**Talab qilinadi:**
- `organizations` jadval
- Har asosiy jadvalga `organization_id`
- Row-level security yoki middleware filtering
- Plan/billing logikasi (Stripe integration)

**Taxminiy vaqt:** 2-3 hafta (katta refactoring)

---

### 🤝 AI job matching

**Sabab:** Foydalanuvchilarga ularning skills'iga mos vakansiyalar tavsiya.

**Talab qilinadi:**
- Job description embedding (OpenAI / sentence-transformers)
- User profile embedding
- pgvector extension + similarity index
- `GET /api/jobs/recommended` endpoint

**Taxminiy vaqt:** 1-2 hafta

---

### 📈 Analytics

**Sabab:** Admin dashboard'da real-time statistika.

**Talab qilinadi:**
- ClickHouse container (alohida DB)
- Event streaming: har request → analytics event
- Kafka yoki Redis Streams broker
- Pre-aggregated views (daily, hourly)

**Taxminiy vaqt:** 1 hafta

---

## Saralash matritsasi

| Yaxshilanish | Foydaliligi | Murakkabligi | ROI |
|---|:---:|:---:|:---:|
| Email verification | Yuqori | Past | ⭐⭐⭐⭐⭐ |
| Password reset | Yuqori | Past | ⭐⭐⭐⭐⭐ |
| Prometheus metrics | O'rta | Past | ⭐⭐⭐⭐ |
| Soft delete | O'rta | Past | ⭐⭐⭐⭐ |
| Per-user rate limit | O'rta | Past | ⭐⭐⭐⭐ |
| Background tasks | Yuqori | O'rta | ⭐⭐⭐⭐ |
| S3 storage | Yuqori | O'rta | ⭐⭐⭐⭐ |
| Redis cache | O'rta | O'rta | ⭐⭐⭐ |
| WebSocket chat | Yuqori | Yuqori | ⭐⭐⭐ |
| OAuth | O'rta | O'rta | ⭐⭐⭐ |
| GraphQL | Past | Yuqori | ⭐⭐ |
| Multi-tenancy | Past (hozircha) | Juda yuqori | ⭐ |
| Elasticsearch | Past (1M+ kerak) | O'rta | ⭐⭐ |
| AI matching | O'rta | Yuqori | ⭐⭐⭐ |
| Analytics | Past | Yuqori | ⭐⭐ |

---

## Tavsiya etilgan birinchi sprint

Agar 1 ta sprint (2 hafta) ajratsangiz, eng yuqori ROI:

1. **Email verification + Password reset** (2 kun)
2. **Soft delete** (1 kun)
3. **Per-user rate limit** (0.5 kun)
4. **Prometheus metrics** (0.5 kun)
5. **S3 storage** (3 kun, MinIO bilan)
6. **Background tasks** (2 kun)

= 1.5 hafta + 0.5 hafta testing/polish = 1 sprint
