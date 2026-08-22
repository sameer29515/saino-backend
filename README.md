# Saino Backend

Express + PostgreSQL (Sequelize/Pg) backend for the Saino healthcare partner directory.

## Structure

| Folder | Purpose |
|--------|---------|
| **Config/** | PostgreSQL connection |
| **Models/** | Database schemas (Partner, Admin) |
| **Controllers/** | authController, partnerController, adminController, publicController |
| **Routers/** | authRoutes, partnerRoutes, adminRoutes, publicRoutes |
| **Middlewares/** | auth (JWT + role guard), upload (multer), errorHandler |
| **Utils/** | asyncHandler, ApiError, generateToken, constants |
| **Scripts/** | seedAdmin.js - creates the first Super Admin |
| **Uploads/** | logo & verification-document uploads, served at /uploads/... |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | API framework |
| **PostgreSQL** | Relational database |
| **JWT** | Authentication |
| **bcryptjs** | Password encryption |
| **Multer** | File upload |

## Database Schema

### Partners Table
| Column | Type | Purpose |
|--------|------|---------|
| id | SERIAL | Primary Key |
| name | VARCHAR | Partner name |
| email | VARCHAR | Login email (unique) |
| password | VARCHAR | Hashed password |
| phone | VARCHAR | Contact number |
| provider_type | VARCHAR | Hospital, Clinic, etc. |
| country | VARCHAR | India, Nepal, UAE |
| location | JSONB | Address, city, district, province |
| services | JSONB | List of offered services |
| status | VARCHAR | Pending, Approved, Rejected |

### Admins Table
| Column | Type | Purpose |
|--------|------|---------|
| id | SERIAL | Primary Key |
| name | VARCHAR | Admin name |
| email | VARCHAR | Login email (unique) |
| password | VARCHAR | Hashed password |
| role | VARCHAR | admin, superadmin |

## Setup

```bash
npm install
cp .env.example .env   # fill in your real DATABASE_URL and JWT_SECRET
npm run seed:admin     # creates the first super admin (see .env for credentials)
npm run dev            # starts with nodemon on PORT (default 5000)
