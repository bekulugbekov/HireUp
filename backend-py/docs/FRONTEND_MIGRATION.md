# Frontend Migration Cheat Sheet

> **TL;DR:** Frontend uchun **hech narsa o'zgartirish kerak emas**. Faqat `VITE_API_URL` muhit o'zgaruvchisini yangi backendga yo'naltiring.

---

## 1. Asosiy qoida

Yangi FastAPI backend Node.js'ning API'sini **1:1 mos** ravishda takrorlaydi:

| Element | O'zgardi? |
|---|---|
| URL pathlar (`/api/auth/...`) | ❌ Yo'q |
| HTTP method'lar | ❌ Yo'q |
| Request body field nomlari | ❌ Yo'q (camelCase saqlandi) |
| Response envelope (`{success, message, data, pagination}`) | ❌ Yo'q |
| Auth header (`Authorization: Bearer ...`) | ❌ Yo'q |
| `Accept-Language` header | ❌ Yo'q |
| `_id` field formati | ⚠️ ObjectId hex → UUID string (string qoladi) |
| File upload field nomlari (`resume`, `avatar`) | ❌ Yo'q |

---

## 2. Yagona o'zgartirish kerak

`.env` faylida bitta o'zgaruvchini almashtiring:

```diff
- VITE_API_URL=https://hireup-backend.onrender.com
+ VITE_API_URL=https://hireup-fastapi.onrender.com
```

Va build qiling. **Bo'ldi.**

---

## 3. ID formatining o'zgarishi (e'tibor bering)

| Eski (MongoDB ObjectId) | Yangi (UUID v4) |
|---|---|
| `"507f1f77bcf86cd799439011"` (24 hex chars) | `"3f9c0a45-2b1e-4c8f-91d2-7a5e8b3e0c1f"` (36 chars) |

Agar frontend ID formatini **qattiq parse qilayotgan** bo'lsa (24-character hex deb), uni o'zgartirish kerak:

```js
// Yaxshi — har ikkalasi bilan ishlaydi
const jobId = response.data._id;

// Yomon — faqat ObjectId bilan ishlaydi
if (/^[0-9a-f]{24}$/.test(id)) { ... }
```

Frontend kodini grep qiling:
```bash
grep -rE "[0-9a-fA-F]{24}|ObjectId" frontend/src/
```

Topilsa, oddiy string deb qarash kerak.

---

## 4. Yangi imkoniyatlar (opt-in)

### A. Refresh token

Login/register endpointlari endi **qo'shimcha `refreshToken` field** qaytaradi:

```diff
{
  "success": true,
  "message": "Logged in successfully",
  "token": "<JWT>",
+ "refreshToken": "abc123xyz...",
  "user": { ... }
}
```

**Frontend hech narsa qilmasa ham ishlaydi.** Access token 24 soat amal qiladi (eskidan 7 kun edi — biroz qisqaroq).

Agar foydalanuvchilar 24 soatdan uzoq ishlashini xohlasangiz, frontend'ga oddiy refresh logikasi qo'shing:

```js
// Token muddati tugagach (401), refresh chaqiring
async function refreshTokens() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
  });
  if (response.ok) {
    const { token, refreshToken } = await response.json();
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    return token;
  }
  // Refresh ham eskirgan → re-login kerak
  window.location.href = '/login';
}

// Axios interceptor namunasi
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshTokens();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

### B. Logout endpoint

Endi mavjud:

```js
async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
  });
  localStorage.clear();
}
```

### C. Logout from all devices

```js
async function logoutAll() {
  await fetch('/api/auth/logout-all', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}
```

Sozlamalar sahifasiga "Barcha qurilmalardan chiqish" tugmasi qo'shsa bo'ladi.

---

## 5. Yangi response field'lar (frontend ulardan foydalanmasa, buzilmaydi)

| Endpoint | Yangi field | Maqsad |
|---|---|---|
| `/api/auth/login`, `/register` | `refreshToken` | Refresh oqimi uchun |
| `/api/users/stats` | `totalApplications` | Admin dashboardda foydali |
| `/api/jobs/my`, `/saved`, `/users` | `pagination` | Endi har list endpoint pagination bilan |

---

## 6. Error response format

Eski va yangi backend bir xil format qaytaradi:

```json
{
  "success": false,
  "message": "Translated error message"
}
```

`Accept-Language` header bilan tarjima ishlaydi (uz/ru/en).

---

## 7. Status code'lar

Bir xil:
- `200 OK` — muvaffaqiyatli
- `201 Created` — yaratish
- `400 Bad Request` — validatsiya xatoligi yoki biznes qoidalar
- `401 Unauthorized` — auth yo'q yoki noto'g'ri
- `403 Forbidden` — ruxsat yo'q
- `404 Not Found` — topilmadi
- `409 Conflict` — duplicate (email, application)
- `413 Payload Too Large` — fayl yoki body juda katta (yangi!)
- `422 Unprocessable Entity` — Pydantic validatsiya (yangi format, frontend uchun 400 deb qarang)
- `429 Too Many Requests` — rate limit
- `500 Internal Server Error` — kutilmagan xatolik

**Bir kichik farq:** FastAPI Pydantic validatsiya xatoliklari **422** qaytaradi, eski Express'da hammasi **400** edi. Frontend agar `if (status === 400)` qilsa, `if (status >= 400 && status < 500)` qilsa yaxshiroq.

---

## 8. Avatar/Resume URL'lar

Eski va yangi bir xil:
```js
const avatarUrl = `${API_URL}/uploads/${user.avatar}`;
// Misol: https://api.hireup.uz/uploads/avatars/3f9c0a45.png
```

Faylnomalar endi UUID-based — eski `Date.now()+rand` formati o'rniga `<uuid>.png` (har URL noyob, guess qilib bo'lmas).

---

## 9. CORS

Yangi backend CORS'ni env'dan oladi. Frontend domeni `CORS_ORIGINS`'ga qo'shilgan bo'lishi kerak. Render.yaml'da bu `sync: false` — dashboard'da qo'lda kiritiladi.

---

## 10. WebSocket?

Hozircha **yo'q** (eski backendda ham yo'q edi). Real-time xabarlar kerak bo'lsa, kelajakdagi yaxshilanish sifatida qo'shish mumkin (`FUTURE_IMPROVEMENTS.md` ko'ring).

---

## 11. Testing — frontend bilan integratsiya

Frontend lokal dev'da yangi backend bilan sinash:

```bash
# Backend
cd backend-py
docker compose up -d
uvicorn app.main:app --reload

# Frontend
cd frontend
# .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Frontend xato bermasa — migratsiya muvaffaqiyatli o'tdi! 🎉

---

## 12. Birinchi 24 soatda kuzatish kerak narsalar

Production switch'dan keyin:

- [ ] `/api/auth/login` muvaffaqiyat foizi (server log'idan)
- [ ] `/api/jobs/` o'rtacha javob vaqti (Render dashboard)
- [ ] `/api/applications/{jobId}` upload muvaffaqiyat foizi
- [ ] 4xx error rate (frontend Sentry / GA)
- [ ] CORS xatoliklari (browser console)
- [ ] Mobile + Telegram WebApp browser'lar (UUID parse qilishi)

Birinchi 24 soatda muammo bo'lmasa — eski Node.js backend'ni o'chirsa bo'ladi.
