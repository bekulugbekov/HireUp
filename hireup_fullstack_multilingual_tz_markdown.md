# HireUp — Full Stack Job Platform
## Technical Specification (TZ)

---

# 1. Project Overview

## Project Name
**HireUp — Job Platform**

## Project Goal
Develop a modern multilingual full-stack job platform where:
- Companies can publish job vacancies
- Users can search and apply for jobs
- Admins can manage the platform
- Authentication and authorization are implemented
- The system supports Uzbek, Russian, and English languages

The application must be scalable, responsive, secure, production-ready, and AI-agent friendly.

---

# 2. Multilingual Support (IMPORTANT)

## Supported Languages
- Uzbek (uz)
- Russian (ru)
- English (en)

## Localization Requirements
The entire application must support multilingual content:

### Frontend
- UI texts
- Buttons
- Labels
- Forms
- Notifications
- Validation messages
- Navigation menus
- Dynamic content

### Backend
- API error messages
- Validation responses
- Notifications
- Emails (optional)

## Recommended Libraries

### Frontend
- react-i18next
- i18next

### Backend
- i18next
- custom localization middleware

## Language Switcher
Requirements:
- Persistent selected language
- Auto-detect browser language (optional)
- Real-time language switching

---

# 3. Tech Stack

## Frontend
- React.js
- React Router DOM
- Axios
- Tailwind CSS
- Redux Toolkit / Context API
- React Hook Form
- react-i18next

## Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT
- bcrypt
- express-validator
- multer
- Swagger

## Deployment
- Frontend → Vercel / Netlify
- Backend → Render / Railway
- Database → MongoDB Atlas

---

# 4. User Roles

| Role | Permissions |
|---|---|
| User | Register, login, apply for jobs |
| Employer | Create and manage jobs |
| Admin | Full platform management |

---

# 5. Authentication System

## Features
- Register
- Login
- Logout
- JWT Authentication
- Password hashing
- Protected routes
- Role-based authorization

## Validation
- Email uniqueness
- Password minimum length
- Required fields

---

# 6. Frontend Requirements

# Public Pages

## Home Page
### Sections
- Hero section
- Search jobs
- Popular categories
- Latest jobs
- Statistics
- Footer

---

## Jobs Page
### Features
- Job cards
- Pagination
- Search
- Filtering
  - Category
  - Salary
  - Location
  - Experience

---

## Job Details Page
### Information
- Job title
- Company name
- Salary
- Description
- Requirements
- Apply button

---

## Authentication Pages

### Login Page
- Email/password
- Validation
- JWT storage

### Register Page
Fields:
- Full name
- Email
- Password
- Role selection

---

# User Dashboard

## Features
- Profile management
- Saved jobs
- Applied jobs
- Resume upload
- Edit profile

---

# Employer Dashboard

## Features
- Create job posts
- Edit/delete jobs
- View applicants
- Statistics

---

# Admin Panel

## Features
- Manage users
- Manage jobs
- Remove content
- Analytics dashboard

---

# 7. Backend Requirements

# REST API Architecture

## Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |

---

## Job APIs

| Method | Endpoint |
|---|---|
| GET | /api/jobs |
| GET | /api/jobs/:id |
| POST | /api/jobs |
| PUT | /api/jobs/:id |
| DELETE | /api/jobs/:id |

---

## Application APIs

| Method | Endpoint |
|---|---|
| POST | /api/applications |
| GET | /api/applications/me |

---

# 8. Database Models

## User Model
```js
{
  fullName,
  email,
  password,
  role,
  avatar,
  language,
  createdAt
}
```

---

## Job Model
```js
{
  title,
  company,
  salary,
  location,
  description,
  requirements,
  category,
  createdBy,
  createdAt
}
```

---

## Application Model
```js
{
  user,
  job,
  resume,
  status,
  createdAt
}
```

---

# 9. Security Requirements

- Password hashing with bcrypt
- JWT authentication
- Helmet.js
- Rate limiting
- CORS protection
- Environment variables
- Input validation

---

# 10. Responsive Design

The application must support:
- Desktop
- Tablet
- Mobile devices

---

# 11. Performance Requirements

- Optimized API responses
- Pagination
- Lazy loading
- Reusable components
- Clean architecture

---

# 12. API Documentation

Swagger documentation required.

Example:
```bash
/api-docs
```

---

# 13. Deployment Requirements

## Backend
- Render or Railway
- Environment variables configured

## Frontend
- Vercel deployment
- Production optimization

---

# 14. UI/UX Requirements

- Modern clean UI
- Minimalistic design
- Fast navigation
- Dark/light mode
- Smooth animations

---

# 15. Recommended Project Structure

## Backend Structure
```bash
src/
 ├── controllers/
 ├── services/
 ├── models/
 ├── routes/
 ├── middleware/
 ├── validators/
 ├── utils/
 ├── config/
 ├── locales/
 └── app.js
```

---

## Frontend Structure
```bash
src/
 ├── components/
 ├── pages/
 ├── layouts/
 ├── routes/
 ├── hooks/
 ├── services/
 ├── store/
 ├── i18n/
 ├── locales/
 └── App.jsx
```

---

# 16. AI Agent Optimization Requirements

The project specification is intentionally structured for:
- AI coding assistants
- Cursor AI
- Claude
- GPT-based agents
- Bolt.new
- Lovable
- v0
- Replit AI

## Important
The generated code should:
- Follow clean architecture
- Use reusable components
- Follow REST API standards
- Be production-ready
- Include comments where necessary
- Use scalable folder structure

---

# 17. Future Improvements

- Real-time notifications
- Chat system
- AI recommendations
- Resume builder
- Payment integration
- WebSocket support
- Redis caching
- Docker support
- CI/CD

---

# 18. Expected Result

A complete multilingual production-ready full-stack job platform with:
- Authentication
- Authorization
- Responsive UI
- RESTful API
- Clean architecture
- Swagger documentation
- Deployment support
- Uzbek/Russian/English language support

---

# 19. Bonus Features (Strong Portfolio Level)

If implemented:
- Docker
- Redis
- CI/CD
- Unit testing
- WebSocket notifications
- Advanced filtering
- Admin analytics dashboard

The project becomes mid-level/full-stack portfolio quality.

