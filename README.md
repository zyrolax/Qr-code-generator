# Requesto

QR stickers that link to an editable webpage. The first use case is
**lost-and-found for college students**: stick a QR on your bottle, laptop, or
ID card — if someone finds it, they scan and message you, and your phone number
is never shown.

Built as a MERN app (MongoDB, Express, React, Node) that runs on localhost.

---

## What's inside

```
Qr-site/
├── client/            React + Vite + Tailwind + React Router
├── server/            Node + Express + Mongoose
├── docker-compose.yml Local MongoDB
├── PLAN.md            The architecture/blueprint
└── README.md          You are here
```

Public sticker URLs always look like `{BASE_URL}/q/{code}` — this format is
permanent because it's printed on physical stickers.

---

## Prerequisites

- **Node.js 18+**
- **MongoDB** — easiest via Docker (below), or a local install on `:27017`.

---

## Setup

### 1. Start MongoDB

With Docker (recommended):

```bash
docker compose up -d
```

This runs MongoDB on `localhost:27017` with a persistent volume. (If you have a
local MongoDB already, you can skip this and just point `MONGODB_URI` at it.)

### 2. Backend

```bash
cd server
cp .env.example .env        # a working dev .env is already included too
npm install
npm run seed                # loads sample data; prints logins + claim codes
npm run dev                 # API on http://localhost:4000
```

> Keep the terminal from `npm run seed` handy — it prints the test logins,
> claim codes, and live sticker URLs you'll use to test every screen.

### 3. Frontend (new terminal)

```bash
cd client
npm install
npm run dev                 # app on http://localhost:5173
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` to the
backend, so everything runs on a single origin and the login cookie just works.

---

## Test accounts (from the seed)

| Role  | Email                   | Password    |
| ----- | ----------------------- | ----------- |
| Admin | `admin@requesto.in`     | `admin1234` |
| User  | `student@requesto.in`   | `user1234`  |

The seed also creates 10 stickers in mixed states (unclaimed, active, paused,
lost, a links-template page, and one with finder messages) plus **two unclaimed
stickers with claim codes** so you can test the claim flow end to end.

---

## Try the full loop

1. Log in as the **student**, open the **Dashboard** — toggle pause/lost,
   open the **editor** (live preview), and read the **inbox**.
2. Open a live sticker URL from the seed output (e.g. an `active` or `lost`
   one) in a private window — this is the **finder** view. Send a message; it
   appears in the student's inbox, and the owner-notification email is printed
   to the **server console** (dev doesn't actually send mail).
3. Log in as the **admin**, go to **Admin → Generate**, create a batch, and
   download the **CSV**, the **sticker sheet PDF**, and the **claim-code cards
   PDF**. Claim one of those codes via the claim box to activate it.

---

## Configuration

All config is via `.env` files (each app has a `.env.example`).

**server/.env**

| Variable          | Meaning                                                        |
| ----------------- | ------------------------------------------------------------- |
| `PORT`            | API port (default 4000)                                       |
| `MONGODB_URI`     | MongoDB connection string                                     |
| `JWT_SECRET`      | Secret for signing login tokens — change in production        |
| `JWT_EXPIRES_DAYS`| Login lifetime in days                                        |
| `CLIENT_ORIGIN`   | Allowed CORS origin (the client URL)                          |
| `BASE_URL`        | Base for public sticker URLs: dev `localhost`, prod `requesto.in` |
| `SMTP_*`, `MAIL_FROM` | Email settings. Blank in dev → emails are logged to console |

For production, set `BASE_URL=https://requesto.in`, `NODE_ENV=production`
(enables the secure cookie flag), a strong `JWT_SECRET`, and real SMTP values.

---

## Tests

Backend tests cover the claim flow, status/lost changes, the finder-message
flow, and admin batch + PDF generation. They use an in-memory MongoDB, so no
running database is needed.

```bash
cd server
npm test
```

---

## How it works (quick tour)

- **Stickers** have a permanent public `code` (in the URL) and a separate secret
  **claim code**. Only a **bcrypt hash** of the claim code is stored — the
  plaintext is shown exactly once, at batch creation.
- **Status** is one of `unclaimed → active ⇄ paused`, plus a `lost` switch.
  The public page renders differently per status and **never** exposes the
  owner's email or phone.
- **Auth** is email + password with the JWT kept in an **httpOnly cookie**.
- **Security:** every endpoint validates input with zod, user text is rendered
  as text (never raw HTML), and claim/login/message endpoints are rate-limited.
  Helmet is on and CORS is restricted to the client origin.

See `PLAN.md` for the full data model and route list.
# Qr-code-generator
