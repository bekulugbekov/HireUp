# HireUp — Ish Platformasi

Zamonaviy ko'p tillli full-stack ish platformasi. Kompaniyalar vakansiya e'lon qiladi, foydalanuvchilar ish izlaydi va ariza beradi.

**Live Demo:** [https://hireup-job.netlify.app](https://hireup-job.netlify.app)

---

## Texnologiyalar

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT autentifikatsiya
- Swagger API hujjatlar
- i18next ko'p tillilik

**Frontend**
- React 18 + Vite
- Redux Toolkit
- Tailwind CSS
- react-i18next (uz / ru / en)

**Deploy**
- Backend → Render
- Frontend → Netlify
- Database → MongoDB Atlas

---

## Xususiyatlar

- Ro'yxatdan o'tish va kirish (JWT)
- 3 foydalanuvchi roli: `user`, `employer`, `admin`
- Vakansiya qidirish, filterlash, sahifalash
- Resume yuklash bilan ariza berish
- Employer dashboard — vakansiya va nomzodlar boshqaruvi
- Admin panel — foydalanuvchilar, vakansiyalar, statistika
- O'zbek / Rus / Ingliz tili
- Qorong'u / Yorug' rejim
- To'liq responsive dizayn

---

## Tezkor ishga tushirish

```bash
git clone https://github.com/bekulugbekov/HireUp.git
cd HireUp

# Backend
cd backend
npm install
cp .env.example .env   # .env ni to'ldiring
npm run dev

# Frontend (yangi terminal)
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`
Swagger: `http://localhost:5000/api-docs`

---

## Muhit o'zgaruvchilari

**backend/.env**
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**frontend/.env** (production uchun)
```env
VITE_API_URL=https://hireup-backend-mdfq.onrender.com
```

---

## Loyiha strukturasi

```
HireUp/
├── backend/          # Node.js REST API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── locales/
│   └── README.md
├── frontend/         # React ilovasi
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── store/
│   │   └── locales/
│   └── README.md
└── README.md
```

---

## API Hujjatlar

Barcha endpointlar Swagger orqali hujjatlangan:

**Live:** [https://hireup-backend-mdfq.onrender.com/api-docs](https://hireup-backend-mdfq.onrender.com/api-docs)

---

## Muallif

**Bekhzod Ukulubekov**
GitHub: [@bekulugbekov](https://github.com/bekulugbekov)
