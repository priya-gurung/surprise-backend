# surprise? — Backend

REST API powering **surprise?**, a wishlist application that lets users reserve gifts without revealing reservations to the wishlist owner.

Built with **Node.js**, **Express**, **Prisma**, and **PostgreSQL**.

## Tech Stack

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Zod
- JWT Authentication
- bcrypt

## Features

- Create wishlists
- Owner authentication
- Wishlist management
- Gift reservations
- Image preview support
- Rate limiting
- Input validation
- Cookie-based authentication

## Getting Started

### Install

```bash
npm install
```

### Environment Variables

Create a `.env` file.

```env
PORT=4000

DATABASE_URL=

JWT_SECRET=

FRONTEND_URL=http://localhost:5173
```

### Run Prisma

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run dev
```

The API will run on:

```
http://localhost:4000
```

Health check:

```
GET /health
```

## Project Structure

```
src/
├── controllers/
├── middleware/
├── routes/
├── services/
├── utils/
└── app.js

prisma/
└── schema.prisma
```

## Authentication

Owner sessions are authenticated using JWTs stored in secure HTTP-only cookies.

Passwords are hashed using bcrypt before storage.

## API

All endpoints return JSON.

See the project API documentation for complete endpoint specifications.

## Database

The application uses PostgreSQL through Prisma ORM.

Supported providers:

- Neon
- Supabase
- Local PostgreSQL

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests:

```bash
npm run test:integration
```

## Deployment

Recommended stack:

- Backend → Render
- Database → Neon PostgreSQL

Configure the following environment variables in production:

- DATABASE_URL
- JWT_SECRET
- FRONTEND_URL
- NODE_ENV=production

## Security

- bcrypt password hashing
- HTTP-only authentication cookies
- Zod request validation
- Helmet security headers
- CORS allow-list
- Rate limiting
- Atomic reservation transactions