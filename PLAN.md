# Requesto — Build Plan

QR stickers that link to an editable webpage. First use case: lost-and-found for
college students. MERN stack, runs on localhost.

> This is the Phase 1 deliverable. Nothing is built yet — this document is the
> blueprint we agreed on before writing code.

---

## 1. Monorepo layout

```
Qr-site/
├── README.md                 # root setup + run steps (final phase)
├── PLAN.md                   # this file
├── docker-compose.yml        # local MongoDB (so no manual install needed)
├── client/                   # React + Vite + Tailwind + React Router
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # routes
│       ├── api.js            # fetch wrapper (credentials: 'include')
│       ├── lib/              # small helpers (auth context, formatters)
│       ├── components/       # shared UI (Button, Input, StatusBadge, ...)
│       └── pages/
│           ├── Landing.jsx
│           ├── Scan.jsx            # /q/:code  (public)
│           ├── Login.jsx
│           ├── Signup.jsx
│           ├── Claim.jsx
│           ├── Dashboard.jsx
│           ├── Editor.jsx          # page editor + live preview
│           ├── Inbox.jsx           # finder messages
│           └── admin/
│               ├── Batch.jsx       # generate stickers
│               └── Stickers.jsx    # list all
└── server/                   # Node + Express + Mongoose
    ├── .env.example
    ├── src/
    │   ├── index.js          # app bootstrap (helmet, cors, rate limits)
    │   ├── db.js             # mongoose connection
    │   ├── models/
    │   │   ├── User.js
    │   │   ├── Sticker.js
    │   │   ├── Message.js
    │   │   └── Scan.js
    │   ├── middleware/
    │   │   ├── auth.js       # JWT from httpOnly cookie, requireAuth, requireAdmin
    │   │   ├── validate.js   # zod wrapper
    │   │   └── error.js      # central error handler
    │   ├── lib/
    │   │   ├── codes.js      # public code + claim code generators
    │   │   └── mailer.js     # Nodemailer; logs to console in dev
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── sticker.routes.js   # claim, list, status, lost mode, page edit
    │   │   ├── public.routes.js    # GET /q/:code data, POST finder message, log scan
    │   │   └── admin.routes.js     # batch, CSV, PDFs, list all
    │   └── seed.js
    └── tests/                # claim, status changes, message flow
```

Two separate `package.json` files (one per app). Keep tooling simple — no
workspace manager needed for a solo student project.

---

## 2. Data models (Mongoose)

### User
| field | type | notes |
|---|---|---|
| email | String, unique, lowercased | |
| passwordHash | String | bcrypt |
| role | String enum `user` \| `admin` | default `user` |
| createdAt | Date | |

### Sticker
| field | type | notes |
|---|---|---|
| code | String, unique, indexed | 6-char public code, permanent, in the URL |
| claimCodeHash | String | bcrypt hash of `RQ-XXXX-XXXX`; plaintext never stored |
| owner | ref User \| null | null until claimed |
| status | enum `unclaimed`\|`active`\|`paused`\|`lost` | default `unclaimed` |
| template | enum `lost_found`\|`links` | default `lost_found` |
| page | subdocument | title, description, imageUrl, note, links[] |
| scanCount | Number | denormalized counter for the dashboard |
| createdAt / updatedAt | Date | timestamps |

`page.links` = `[{ label, url }]`.

### Message (finder → owner)
| field | type | notes |
|---|---|---|
| sticker | ref Sticker | |
| foundWhere | String | "Where did you find it?" |
| body | String | finder's message |
| finderContact | String, optional | finder chooses to share or not |
| read | Boolean | default false |
| createdAt | Date | |

### Scan
| field | type | notes |
|---|---|---|
| sticker | ref Sticker | |
| userAgent | String | |
| createdAt | Date | timestamp only — **no location** |

---

## 3. Codes (the permanent contract)

- **Public code**: 6 chars from `23456789abcdefghjkmnpqrstuvwxyz`
  (no `0/O`, `1/l/I`). Lives in the URL `{BASE_URL}/q/{code}` — **permanent**,
  because it is printed on physical stickers.
- **Claim code**: `RQ-XXXX-XXXX` using an unambiguous uppercase+digit alphabet.
  Shown once at generation, printed on a *separate* card, stored only as a
  bcrypt hash. The claim code never appears on the sticker itself.
- `BASE_URL` comes from `.env` → dev `http://localhost:5173`, prod
  `https://requesto.in`.

---

## 4. API routes

### Public (no auth)
- `GET  /api/q/:code` — returns render data by status. Never includes owner
  email/phone. Logs a Scan row as a side effect.
- `POST /api/q/:code/message` — finder message. Rate-limited. Emails owner.

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login` — sets httpOnly JWT cookie. Rate-limited.
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Owner (requireAuth)
- `POST  /api/stickers/claim` — body `{ claimCode }`. Rate-limited. Links
  sticker to user, sets status `active`, template `lost_found`.
- `GET   /api/stickers` — my stickers.
- `PATCH /api/stickers/:id/status` — active ⇄ paused.
- `PATCH /api/stickers/:id/lost` — lost mode on/off.
- `PUT   /api/stickers/:id/page` — edit page content + template.
- `GET   /api/stickers/:id/messages` — inbox for one sticker.
- `PATCH /api/messages/:id/read`

### Admin (requireAdmin)
- `POST /api/admin/stickers/batch` — body `{ count }`. Creates N stickers.
- `GET  /api/admin/stickers/batch/:batchId.csv` — code, claim code, URL.
- `GET  /api/admin/stickers/batch/:batchId/stickers.pdf` — A4 QR sheet
  (~2.5 cm QR, "If found, scan me" + "requesto.in").
- `GET  /api/admin/stickers/batch/:batchId/cards.pdf` — claim-code cards.
- `GET  /api/admin/stickers` — list all with status.

> Claim codes are returned **only** in the batch-creation response / CSV / cards
> PDF, generated in the same request before hashing. They are never retrievable
> again.

---

## 5. Screens → routes

| Route | Screen | Access |
|---|---|---|
| `/` | Landing ("Lose it. Get it back.") | public |
| `/q/:code` | Scan page (status-aware) | public |
| `/login`, `/signup` | Auth | public |
| `/claim` | Claim flow | auth |
| `/dashboard` | Sticker list, toggles, lost mode | auth |
| `/dashboard/stickers/:id/edit` | Page editor + live preview | auth |
| `/dashboard/stickers/:id/messages` | Inbox | auth |
| `/admin/batch` | Generate batch, download CSV/PDFs | admin |
| `/admin/stickers` | All stickers | admin |

---

## 6. Security & quality (applied throughout)

- Input validation with **zod** on every route.
- User text rendered as text only (React default) — no `dangerouslySetInnerHTML`.
- `express-rate-limit` on claim, login, and finder messages.
- `helmet`, CORS restricted to the client origin, central error handler.
- Passwords & claim codes bcrypt-hashed. JWT in httpOnly, sameSite cookie.
- Seed: 1 admin, 1 normal user, 10 stickers in mixed states (unclaimed, active,
  paused, lost, with/without messages) so every screen is testable.
- Backend tests: claim flow, status changes, finder-message flow.

---

## 7. Phases (stop after each for testing)

1. **Plan** — this document. ← *waiting for your OK*
2. **Backend** — models, auth, claim, stickers, pages, messages, scans, seed.
3. **Frontend** — landing, scan, auth, claim, dashboard, editor, inbox.
4. **Admin** — batch generation, CSV, sticker PDF, claim-code cards.
5. **Polish** — mobile layout, empty states, root README with run steps.

---

## 8. Key dependencies

- **server**: express, mongoose, bcryptjs, jsonwebtoken, cookie-parser, zod,
  helmet, cors, express-rate-limit, nodemailer, qrcode, pdfkit, dotenv;
  dev: nodemon, vitest/jest + supertest.
- **client**: react, react-dom, react-router-dom, vite, tailwindcss, @vitejs/plugin-react.
