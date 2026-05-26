# Deployment qo'llanmasi

HireUp FastAPI backendni production'ga uch xil yo'l bilan deploy qilish mumkin:

1. **Render.com** — eng oson (managed Postgres + auto TLS + auto deploy)
2. **VPS + Docker Compose** — to'liq nazorat, Nginx + Let's Encrypt
3. **Kubernetes** — katta miqyos uchun (ushbu hujjatda yo'q)

---

## 1. Render.com (eng oson)

`backend-py/render.yaml` blueprint allaqachon tayyor. U FastAPI servisi + managed Postgres yaratadi.

### Qadamlar

1. **GitHub repo'ni Render'ga ulang** — Dashboard → **New** → **Blueprint** → repository tanlang
2. Render `backend-py/render.yaml`'ni o'qib, ikkita resource yaratadi:
   - `hireup-fastapi` (Web Service, Docker)
   - `hireup-postgres` (Postgres 16, free plan)
3. **Environment Variables** dashboard'da to'ldiring:
   - `CORS_ORIGINS` = `https://hireup.uz,https://www.hireup.uz`
   - `TRUSTED_HOSTS` = `<servis-name>.onrender.com,api.hireup.uz` (custom domain bo'lsa)
4. **Custom domain** — Settings → Custom Domain → DNS CNAME yozing
5. Deploy avtomatik boshlanadi. Tugagach `https://<servis-name>.onrender.com/api/health` ishlaydi
6. **Migratsiyalar avtomatik** ishga tushadi — `docker/entrypoint.sh` `alembic upgrade head`'ni har deploy'da chaqiradi

### Render xususiyatlari

- TLS sertifikati avtomatik (Let's Encrypt)
- `/api/health` healthcheck blueprint'da yozilgan
- `JWT_SECRET` Render tomonidan generatsiya qilinadi (`generateValue: true`)
- Free plan'da DB 1 GB, web 750 soat/oy

---

## 2. VPS + Docker Compose (production grade)

### 2.1. Talablar

- Ubuntu 22.04+ yoki Debian 12+ VPS
- Domain `api.hireup.uz` A-recordi VPS IP'siga ishora qiladi
- `docker`, `docker compose`, `certbot` o'rnatilgan

### 2.2. Birinchi sozlash

```bash
# Kod
git clone <repo> /opt/hireup
cd /opt/hireup/backend-py

# Production env
cp .env.production.example .env.production
nano .env.production    # parol, JWT_SECRET, CORS_ORIGINS to'ldiring

# JWT_SECRET generate
python3 -c "import secrets; print(secrets.token_hex(48))"

# Let's Encrypt sertifikat
certbot certonly --standalone -d api.hireup.uz
```

### 2.3. Ishga tushirish

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production up -d

# Loglarni ko'rish
docker compose logs -f api

# Migratsiya holatini tekshirish
docker compose exec api alembic current
```

`docker-compose.prod.yml` 3 ta servisni ko'taradi:
- `postgres` (port host'ga ochilmaydi, faqat ichki network)
- `api` (Nginx orqali kirish)
- `nginx` (443 SSL + reverse proxy + static `/uploads` xizmati)

### 2.4. Update flow

```bash
cd /opt/hireup
git pull
docker compose -f backend-py/docker-compose.yml \
  -f backend-py/docker-compose.prod.yml \
  --env-file backend-py/.env.production \
  up -d --build api

# Migratsiya avtomatik entrypoint orqali
```

### 2.5. Backup

```bash
# Postgres dump kuniga
docker compose exec postgres pg_dump -U hireup hireup \
  | gzip > /opt/hireup/backups/hireup-$(date +%F).sql.gz

# Crontab:
0 3 * * * cd /opt/hireup && /usr/bin/docker compose exec -T postgres pg_dump -U hireup hireup | gzip > /opt/hireup/backups/hireup-$(date +\%F).sql.gz

# Uploads backup
tar -czf /opt/hireup/backups/uploads-$(date +%F).tar.gz \
  -C /var/lib/docker/volumes/backend-py_uploads/_data .
```

### 2.6. Let's Encrypt avtomatik yangilash

```bash
# /etc/cron.d/certbot-renew
0 0,12 * * * root certbot renew --quiet --post-hook "docker compose -f /opt/hireup/backend-py/docker-compose.prod.yml restart nginx"
```

---

## 3. CI/CD release

Repo'da tag yaratganingizda Docker image avtomatik build bo'lib GHCR'ga push qilinadi:

```bash
git tag backend-py-v1.0.0
git push origin backend-py-v1.0.0
```

`.github/workflows/release.yml` ishga tushadi:
1. Multi-arch image build (`linux/amd64` cache bilan)
2. `ghcr.io/<owner>/<repo>/backend-py:<tag>` va `:latest`
3. **Smoke test** — yangi image'ni Postgres bilan ishga tushirib `/api/health`'ni curl qiladi

Production VPS'da yangi tag'ni ishlatish:

```bash
export API_IMAGE=ghcr.io/your-org/hireup-backend-py:backend-py-v1.0.0
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 4. Production checklist

Birinchi deploy oldidan tekshiring:

- [ ] `JWT_SECRET` kamida 32 ta belgi, oldindan generate qilingan (env'da default emas)
- [ ] `POSTGRES_PASSWORD` random va kuchli (oldindan generate)
- [ ] `CORS_ORIGINS` faqat real frontend domen(lar), `*` YO'Q
- [ ] `TRUSTED_HOSTS` aniq belgilangan (production'da `*` emas)
- [ ] `APP_DEBUG=false`
- [ ] `BCRYPT_ROUNDS=12` (Phase 8 test uchun 4 edi)
- [ ] `LOGIN_RATE_LIMIT` va `REGISTER_RATE_LIMIT` strictroq
- [ ] Postgres backup cron yoki managed backup yoqilgan
- [ ] Uploads volume backup'da
- [ ] Let's Encrypt avtomatik yangilash sozlangan
- [ ] Log aggregator (Loki/ELK/Datadog) ulangan (ixtiyoriy)
- [ ] `/api/health/ready` orqali DB ulanish tekshiriladi (load balancer probe)
- [ ] Frontend `.env`'da `VITE_API_URL` yangi backendga ko'rsatilgan
- [ ] Eski Node.js backendni o'chirish vaqti rejalashtirilgan

---

## 5. Tezkor diagnostika

```bash
# API logs (real-time)
docker compose logs -f api

# Postgres tezkor query holati
docker compose exec postgres psql -U hireup -d hireup -c \
  "SELECT pid, usename, state, query_start, query FROM pg_stat_activity WHERE state != 'idle';"

# Migratsiya holati
docker compose exec api alembic current
docker compose exec api alembic history

# Rate limit ishlayotganligini tekshirish
for i in {1..15}; do curl -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"x@x.com","password":"x"}' -w "%{http_code}\n" -o /dev/null -s; done
# Oxirgi so'rovlar 429 qaytaradi
```

---

## 6. Production farqlanishi (dev vs prod)

| Soha | Dev | Prod |
|---|---|---|
| `APP_DEBUG` | `true` | `false` |
| `CORS_ORIGINS` | `localhost:5173` | aniq domenlar |
| `TRUSTED_HOSTS` | `*` | aniq domenlar |
| `BCRYPT_ROUNDS` | 12 (test'da 4) | 12 |
| `LOGIN_RATE_LIMIT` | 10/min | 5/min |
| `JWT_SECRET` | default | random 64 hex |
| Static `/uploads` | FastAPI mount | Nginx alias |
| TLS | yo'q | Let's Encrypt |
| Gunicorn workers | 2 | `cpu*2+1` |
| Postgres port | exposed | network only |
