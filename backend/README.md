# HireUp — Backend API

HireUp ish platformasining server tomoni. Node.js, Express.js va MongoDB asosida qurilgan RESTful API.

## Texnologiyalar

| Texnologiya | Maqsad |
|---|---|
| Node.js + Express.js | Server va routing |
| MongoDB + Mongoose | Ma'lumotlar bazasi |
| JWT | Autentifikatsiya |
| bcryptjs | Parol shifrlash |
| multer | Fayl yuklash (resume) |
| express-validator | Kiruvchi ma'lumotlarni tekshirish |
| helmet + cors | Xavfsizlik |
| express-rate-limit | So'rovlar cheklovi |
| i18next | Ko'p tillilik (uz/ru/en) |
| swagger-ui-express | API hujjatlash |

## Papka strukturasi

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js             # MongoDB ulanish
│   │   └── swagger.js        # Swagger sozlama
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── jobController.js
│   │   ├── applicationController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT tekshirish
│   │   ├── i18n.js           # Til middleware
│   │   ├── upload.js         # Multer sozlama
│   │   └── errorHandler.js   # Global xato tutish
│   ├── models/
│   │   ├── User.js
│   │   ├── Job.js
│   │   └── Application.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── jobs.js
│   │   ├── applications.js
│   │   └── users.js
│   ├── validators/
│   │   ├── authValidator.js
│   │   └── jobValidator.js
│   ├── locales/
│   │   ├── uz.json
│   │   ├── ru.json
│   │   └── en.json
│   ├── utils/
│   │   └── generateToken.js
│   └── app.js
├── uploads/                  # Yuklangan fayllar
├── server.js
├── .env.example
└── package.json
```

## O'rnatish va ishga tushirish

### 1. Klonlash

```bash
git clone https://github.com/bekulugbekov/HireUp.git
cd HireUp/backend
```

### 2. Paketlarni o'rnatish

```bash
npm install
```

### 3. Muhit o'zgaruvchilarini sozlash

`.env.example` faylini nusxa oling va `.env` yarating:

```bash
cp .env.example .env
```

`.env` faylini to'ldiring:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hireup
JWT_SECRET=sizning_maxfiy_kalitingiz
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 4. Ishga tushirish

```bash
# Development rejimi (nodemon bilan)
npm run dev

# Production rejimi
npm start
```

Server `http://localhost:5000` da ishga tushadi.

## API Endpointlar

### Autentifikatsiya

| Metod | Endpoint | Tavsif | Himoya |
|---|---|---|---|
| POST | `/api/auth/register` | Ro'yxatdan o'tish | — |
| POST | `/api/auth/login` | Tizimga kirish | — |
| GET | `/api/auth/me` | Joriy foydalanuvchi | JWT |

### Vakansiyalar

| Metod | Endpoint | Tavsif | Himoya |
|---|---|---|---|
| GET | `/api/jobs` | Barcha vakansiyalar (filter, sahifalash) | — |
| GET | `/api/jobs/:id` | Bitta vakansiya | — |
| GET | `/api/jobs/my` | Mening vakansiyalarim | employer |
| POST | `/api/jobs` | Vakansiya yaratish | employer |
| PUT | `/api/jobs/:id` | Vakansiyani yangilash | employer |
| DELETE | `/api/jobs/:id` | Vakansiyani o'chirish | employer |

### Arizalar

| Metod | Endpoint | Tavsif | Himoya |
|---|---|---|---|
| POST | `/api/applications/:jobId` | Ariza berish (resume bilan) | user |
| GET | `/api/applications/my` | Mening arizalarim | user |
| GET | `/api/applications/job/:jobId` | Vakansiya arizalari | employer |
| PATCH | `/api/applications/:id/status` | Ariza holatini yangilash | employer |

### Foydalanuvchilar

| Metod | Endpoint | Tavsif | Himoya |
|---|---|---|---|
| PUT | `/api/users/profile` | Profilni yangilash | JWT |
| POST | `/api/users/saved/:jobId` | Vakansiyani saqlash/olib tashlash | JWT |
| GET | `/api/users/saved` | Saqlangan vakansiyalar | JWT |
| GET | `/api/users` | Barcha foydalanuvchilar | admin |
| DELETE | `/api/users/:id` | Foydalanuvchini o'chirish | admin |
| GET | `/api/users/stats` | Statistika | admin |

## Foydalanuvchi rollari

| Rol | Imkoniyatlar |
|---|---|
| `user` | Vakansiyalarni ko'rish, ariza berish, saqlash |
| `employer` | Vakansiya joylash, nomzodlarni boshqarish |
| `admin` | To'liq boshqaruv, statistika |

## Ko'p tillilik

Barcha API xabarlari `Accept-Language` header orqali lokalizatsiya qilinadi:

```
Accept-Language: uz   → O'zbek tili
Accept-Language: ru   → Rus tili
Accept-Language: en   → Ingliz tili
```

Lokale fayllari: `src/locales/uz.json`, `ru.json`, `en.json`

## API Hujjatlari (Swagger)

Server ishga tushgandan so'ng:

```
http://localhost:5000/api-docs
```

Live: `https://hireup-backend-mdfq.onrender.com/api-docs`

## Xavfsizlik

- Parollar `bcryptjs` bilan hash qilinadi (12 round)
- JWT token 7 kun amal qiladi
- `helmet.js` HTTP xavfsizlik headerlari
- Rate limiting: 15 daqiqada 100 ta so'rov
- CORS faqat ruxsat etilgan originga
- `express-validator` bilan input tekshiruv

## Deploy (Render)

1. [render.com](https://render.com) da yangi **Web Service** yarating
2. GitHub reponi ulang: `bekulugbekov/HireUp`
3. **Root Directory**: `backend`
4. **Build**: `npm install` | **Start**: `npm start`
5. Environment Variables qo'shing:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLIENT_URL` (Netlify URL)
   - `NODE_ENV=production`

## Muhit talablari

- Node.js 18+
- MongoDB Atlas yoki lokal MongoDB
- npm 9+
