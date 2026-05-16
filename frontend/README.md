# HireUp — Frontend

HireUp ish platformasining mijoz tomoni. React 18, Vite, Tailwind CSS va Redux Toolkit asosida qurilgan.

## Texnologiyalar

| Texnologiya | Maqsad |
|---|---|
| React 18 | UI kutubxonasi |
| Vite | Build vositasi |
| React Router v6 | Routing |
| Redux Toolkit | Global holat boshqaruvi |
| Axios | HTTP so'rovlar |
| Tailwind CSS | Dizayn |
| React Hook Form | Forma boshqaruvi |
| react-i18next | Ko'p tillilik |
| react-hot-toast | Bildirishnomalar |

## Papka strukturasi

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx       # Navigatsiya paneli
│   │   │   ├── Footer.jsx       # Sahifa pastki qismi
│   │   │   └── Spinner.jsx      # Yuklanish animatsiyasi
│   │   └── jobs/
│   │       └── JobCard.jsx      # Vakansiya kartasi
│   ├── pages/
│   │   ├── HomePage.jsx         # Bosh sahifa
│   │   ├── JobsPage.jsx         # Vakansiyalar ro'yxati
│   │   ├── JobDetailPage.jsx    # Vakansiya tafsiloti
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── user/
│   │   │   └── DashboardPage.jsx
│   │   ├── employer/
│   │   │   ├── PostJobPage.jsx
│   │   │   └── MyJobsPage.jsx
│   │   └── admin/
│   │       └── AdminPage.jsx
│   ├── layouts/
│   │   └── MainLayout.jsx       # Umumiy layout
│   ├── routes/
│   │   └── PrivateRoute.jsx     # Himoyalangan yo'llar
│   ├── hooks/
│   │   ├── useAuth.js           # Autentifikatsiya hook
│   │   └── useDarkMode.js       # Qorong'u rejim hook
│   ├── services/
│   │   ├── api.js               # Axios instance
│   │   ├── authService.js
│   │   ├── jobService.js
│   │   ├── applicationService.js
│   │   └── userService.js
│   ├── store/
│   │   ├── index.js             # Redux store
│   │   └── slices/
│   │       ├── authSlice.js
│   │       └── jobsSlice.js
│   ├── i18n/
│   │   └── index.js             # i18n sozlama
│   ├── locales/
│   │   ├── uz.json
│   │   ├── ru.json
│   │   └── en.json
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
├── netlify.toml
└── package.json
```

## O'rnatish va ishga tushirish

### 1. Klonlash

```bash
git clone https://github.com/bekulugbekov/HireUp.git
cd HireUp/frontend
```

### 2. Paketlarni o'rnatish

```bash
npm install
```

### 3. Muhit o'zgaruvchisini sozlash

`.env` fayl yarating (development uchun shart emas — proxy ishlaydi):

```env
# Faqat production deploy uchun kerak
VITE_API_URL=https://hireup-backend-mdfq.onrender.com
```

> Development da Vite proxy orqali `http://localhost:5000` ga ulanadi.

### 4. Ishga tushirish

```bash
npm run dev
```

Ilova `http://localhost:5173` da ochiladi.

## Sahifalar va Routelar

| Sahifa | Yo'l | Himoya |
|---|---|---|
| Bosh sahifa | `/` | — |
| Vakansiyalar | `/jobs` | — |
| Vakansiya tafsiloti | `/jobs/:id` | — |
| Kirish | `/login` | — |
| Ro'yxatdan o'tish | `/register` | — |
| Foydalanuvchi dashboard | `/dashboard` | `user` |
| Vakansiya joylash | `/employer/post-job` | `employer` |
| Mening vakansiyalarim | `/employer/jobs` | `employer` |
| Admin panel | `/admin` | `admin` |

## Xususiyatlar

### Foydalanuvchi (user)
- Vakansiyalarni qidirish va filterlash
- Vakansiyaga ariza berish (resume yuklash bilan)
- Vakansiyalarni saqlash
- Ariza holati kuzatish

### Ish beruvchi (employer)
- Vakansiya e'lon qilish va tahrirlash
- Nomzodlar ro'yxatini ko'rish
- Ariza holatini yangilash (`pending → accepted/rejected`)

### Admin
- Barcha foydalanuvchilarni boshqarish
- Barcha vakansiyalarni boshqarish
- Statistika dashboard

## Ko'p tillilik

Ilova 3 tilda ishlaydi — til Navbar dagi tugmachalar orqali o'zgartiriladi va `localStorage` da saqlanadi:

| Kod | Til |
|---|---|
| `uz` | O'zbek tili (standart) |
| `ru` | Rus tili |
| `en` | Ingliz tili |

Til fayllari: `src/locales/uz.json`, `ru.json`, `en.json`

## Qorong'u / Yorug' rejim

Navbar dagi 🌙 / ☀️ tugmacha orqali almashtiriladi. Tanlangan tema `localStorage` da saqlanadi.

## Build qilish

```bash
npm run build
```

`dist/` papkasida tayyor fayllar hosil bo'ladi.

## Deploy (Netlify)

1. [netlify.com](https://netlify.com) da yangi sayt yarating
2. GitHub reponi ulang: `bekulugbekov/HireUp`
3. Sozlamalar:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Environment Variable qo'shing:
   - `VITE_API_URL=https://hireup-backend-mdfq.onrender.com`
5. Deploy!

`netlify.toml` fayli SPA routing uchun redirect sozlamalarini o'z ichiga oladi.

## Muhit talablari

- Node.js 18+
- npm 9+

## Live Demo

- Frontend: [https://hireup-job.netlify.app](https://hireup-job.netlify.app)
- Backend API: [https://hireup-backend-mdfq.onrender.com](https://hireup-backend-mdfq.onrender.com)
- Swagger: [https://hireup-backend-mdfq.onrender.com/api-docs](https://hireup-backend-mdfq.onrender.com/api-docs)
