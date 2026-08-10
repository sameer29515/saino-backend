# Saino Backend

Express + MongoDB (Mongoose) backend for the Saino healthcare partner directory.

## Structure

```
Config/         MongoDB connection
Models/         Mongoose schemas (Partner, Admin, Service, Location, ContactEnquiry, WebsiteContent)
Middlewares/    auth (JWT + role guard), upload (multer), errorHandler
Controllers/    authController, partnerController, adminController, publicController
Routers/        authRoutes, partnerRoutes, adminRoutes, publicRoutes
Utils/          asyncHandler, ApiError, generateToken, constants (enums)
Scripts/        seedAdmin.js - creates the first Super Admin
Uploads/        logo & verification-document uploads, served at /uploads/...
```

## Setup

```bash
npm install
cp .env.example .env   # fill in your real MONGO_URI and JWT_SECRET
npm run seed:admin     # creates the first super admin (see .env for credentials)
npm run dev            # starts with nodemon on PORT (default 5000)
```

## Roles

- **partner** – a healthcare provider account (hospital, clinic, pharmacy, etc.)
- **admin / superadmin** – Saino staff who review and manage listings

Admins are not self-registered; only created via `Scripts/seedAdmin.js` (or by another admin, if you extend it later).

## Auth

`POST /api/auth/partner/register` → create partner account (status starts as `draft`)
`POST /api/auth/partner/login` → returns `{ token }`
`POST /api/auth/admin/login` → returns `{ token }`
`GET /api/auth/me` (Bearer token) → current user

All protected routes expect `Authorization: Bearer <token>`.

## Partner Portal (`/api/partner/*`, requires partner token)

| Method | Route | Purpose |
|---|---|---|
| GET | `/profile` | get own profile |
| PUT | `/profile` | update name/phone/website/about/providerType |
| POST | `/profile/logo` | upload logo (`multipart/form-data`, field `logo`) |
| POST | `/verification/documents` | upload registration/license docs (field `documents`, up to 5) |
| PUT | `/location` | set address/city/district/province/branches |
| PUT | `/services` | set services array (OPD, Laboratory, Pharmacy, Emergency, Yoga, Fitness, Insurance) |
| POST | `/submit` | submit completed profile for admin review |
| GET | `/status` | check current review status |

## Super Admin (`/api/admin/*`, requires admin token)

| Method | Route | Purpose |
|---|---|---|
| GET | `/dashboard` | summary counts |
| GET | `/partners` | list/filter/search partners |
| GET | `/partners/:id` | full partner detail |
| PUT | `/partners/:id` | edit any listing field |
| PUT | `/partners/:id/approve` | approve → publishes on public site |
| PUT | `/partners/:id/reject` | reject with `{ reason }` → partner can edit & resubmit |
| PUT | `/partners/:id/publish` | re-publish an approved listing |
| PUT | `/partners/:id/hide` | hide from public site |
| PUT | `/partners/:id/suspend` | suspend the account/listing |
| DELETE | `/partners/:id` | delete permanently |
| GET/POST/PUT/DELETE | `/locations` | manage location master data |
| GET/POST/PUT/DELETE | `/services` | manage service catalog |
| GET | `/enquiries` | list contact form submissions |
| PUT | `/enquiries/:id` | update enquiry status |
| GET/PUT | `/content/:section` | manage homepage/solutions/about/contact content |

## Public Website (`/api/public/*`, no auth)

| Method | Route | Purpose |
|---|---|---|
| GET | `/partners` | search/filter published, approved listings (`search`, `location`, `providerType`, `service`, `page`, `limit`) |
| GET | `/partners/:id` | single public provider profile |
| GET | `/provider-types` | list of provider categories |
| GET | `/services` | active service catalog |
| GET | `/locations` | location list for filters |
| GET | `/content/:section` | homepage/solutions/about/contact content |
| POST | `/contact` | submit contact form |

## Listing lifecycle

```
draft -> (submit) -> pending -> (admin approve) -> approved + published
                          \-> (admin reject) -> rejected -> partner edits -> pending again
approved -> (hide) -> approved, not published
approved -> (suspend) -> suspended, not published
```
