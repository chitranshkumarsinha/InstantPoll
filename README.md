# 🗳️ InstantPoll

**Create a poll. Share a code. Watch the votes roll in — live.**

InstantPoll is a full-stack, real-time voting application. A logged-in user creates a poll and gets back a short, shareable **6-character secret code**. Anyone with that code can join the "voting room," cast one vote per email address, and watch the results bars update **instantly** for everyone in the room via WebSockets — no page refresh required.

**🔗 Live demo:** [instant-poll-tau.vercel.app](https://instant-poll-tau.vercel.app)

---

## ✨ Features

- 🔐 **Auth** — Email/password signup & login secured with `bcrypt` password hashing and `JWT` tokens
- ➕ **Create polls** — Question + 2–10 custom options, configurable expiry (in hours), public or private visibility
- 🔑 **Secret codes** — Every poll gets a unique, auto-generated 6-character join code
- 🗳️ **One vote per email** — Voters verify their email before voting; duplicate votes are blocked at the database level
- ⚡ **Real-time results** — Vote counts and percentage bars update live across all connected clients using **Socket.IO**
- 🌍 **Public poll discovery** — Browse a feed of currently active public polls
- ⏳ **Auto-expiry** — Polls stop accepting votes once their expiration time passes
- 🎨 **Clean, dark-themed UI** — Built with React + Tailwind CSS and `lucide-react` icons

---

## 🧱 Tech Stack

| Layer          | Technology |
|----------------|------------|
| **Frontend**   | React 19, React Router 7, Vite, Tailwind CSS, `socket.io-client`, `lucide-react` |
| **Backend**    | Node.js, Express 5, `socket.io` |
| **Database**   | PostgreSQL (via [`postgres`](https://github.com/porsager/postgres) — `postgres.js`) |
| **Auth**       | `bcrypt` (password hashing) + `jsonwebtoken` (JWT) |
| **Real-time**  | WebSockets via Socket.IO (poll "rooms" keyed by poll ID) |
| **Optional**   | Redis (caching / OTP scaffolding present but currently commented out), Resend & Nodemailer (email, currently unused) |

---

## 🏗️ Architecture

```
InstantPoll/
├── Backend/
│   ├── controllers/
│   │   ├── auth_controller.js     # Signup / login logic
│   │   └── poll_controller.js     # Create poll, vote, results, public polls
│   ├── middleware/
│   │   └── auth.js                # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   └── poll.js                # /api/polls/*
│   ├── db.js                      # PostgreSQL connection (postgres.js)
│   ├── redis.js                   # Redis client (optional/experimental)
│   └── server.js                  # Express app + Socket.IO server entrypoint
│
└── Frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx           # Enter a code to join a poll
        │   ├── Login.jsx          # Login / signup
        │   ├── CreatePoll.jsx     # Poll creation form
        │   ├── VotingRoom.jsx     # Email verification → vote → live results
        │   └── PublicPolls.jsx    # Browse active public polls
        ├── App.jsx                # Router + Navbar
        └── config.js              # API base URL (VITE_API_URL)
```

**How it works, end to end:**

1. A user **signs up / logs in** → receives a JWT stored in `localStorage`.
2. Logged-in user **creates a poll** (question + options + duration + public/private) → backend generates a unique secret code and stores the poll and options in Postgres.
3. The poll creator **shares the code** (e.g. `MERN99`).
4. Anyone visiting `/poll/:code` **verifies their email**, then casts a vote.
5. On vote, the backend inserts the vote row and **emits a `vote_cast` event** over Socket.IO to everyone in that poll's room.
6. All connected clients update their **live result bars** in real time — no polling/refresh needed.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- A PostgreSQL database (e.g. local Postgres, [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Render](https://render.com))
- (Optional) A Redis instance if you re-enable the Redis-based flows

### 1. Clone the repo

```bash
git clone https://github.com/chitranshkumarsinha/InstantPoll.git
cd InstantPoll
```

### 2. Set up the Backend

```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/`:

```env
PORT=5000
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<database>
JWT_SECRET=your_super_secret_jwt_key
CLIENT=http://localhost:5173
```

Set up the database schema (adjust to your Postgres client of choice):

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE polls (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER REFERENCES users(id),
  question TEXT NOT NULL,
  secret_code TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL
);

CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  option_id INTEGER REFERENCES poll_options(id) ON DELETE CASCADE,
  voter_email TEXT NOT NULL,
  UNIQUE (poll_id, voter_email)
);
```

Run the backend:

```bash
npm run dev     # nodemon (hot reload)
# or
npm start       # plain node
```

The API will be live at `http://localhost:5000`.

### 3. Set up the Frontend

```bash
cd ../Frontend
npm install
```

Create a `.env` file in `Frontend/`:

```env
VITE_API_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```

The app will be live at `http://localhost:5173`.

> **Note:** A few frontend pages (`CreatePoll.jsx`, `VotingRoom.jsx`) currently point directly at a deployed backend URL (`https://instantpoll-backend.onrender.com`) rather than the `VITE_API_URL` config value in `config.js`. Update those `fetch`/`socket.io-client` calls to use `API_URL` if you want the app to fully respect your local `.env` during development.

---

## 📡 API Reference

**Base URL:** `/api`

### Auth

| Method | Endpoint         | Description             | Auth |
|--------|------------------|--------------------------|------|
| POST   | `/auth/signup`   | Register a new user      | ❌ |
| POST   | `/auth/login`    | Log in, receive a JWT    | ❌ |

### Polls

| Method | Endpoint                    | Description                                  | Auth |
|--------|------------------------------|-----------------------------------------------|------|
| POST   | `/polls/create`              | Create a new poll                              | ✅ (Bearer JWT) |
| GET    | `/polls/:code`                | Get poll details + live vote counts by code   | ❌ |
| POST   | `/polls/:id/check-email`      | Check if an email has already voted            | ❌ |
| POST   | `/polls/:id/vote`              | Cast a vote (email + option ID)                 | ❌ |
| GET    | `/polls/public/active`        | List active public polls                       | ❌ |

### WebSocket Events (Socket.IO)

| Event        | Direction        | Payload                | Description |
|--------------|-------------------|-------------------------|--------------|
| `join_poll`  | Client → Server   | `pollId`                | Joins the socket room for a specific poll |
| `vote_cast`  | Server → Room     | `{ optionId }`           | Broadcast to everyone in the poll room when a new vote is cast |

---

## 🎨 UI Preview

- **Home** — enter a 6-character code to jump straight into a voting room
- **Login/Signup** — simple auth screen
- **Create Poll** — dynamic option list (2–10), duration slider, public/private toggle, generates a shareable code on success
- **Voting Room** — email verification → single-click voting → live animated result bars
- **Public Polls** — browse a feed of currently active public polls

---

## 🗺️ Roadmap Ideas

- [ ] Wire up Redis-backed OTP email verification (scaffolding already present in `auth_controller.js` / `poll_controller.js`)
- [ ] Move all frontend API calls to consistently use `VITE_API_URL` from `config.js`
- [ ] Poll result charts/analytics for creators
- [ ] Rate limiting on voting/auth endpoints
- [ ] Dockerize backend + frontend for easier local setup

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

No license file is currently included in this repository. Consider adding one (e.g. MIT) if you intend for others to reuse this code.

---

## 👤 Author

**Chitransh Kumar Sinha**
GitHub: [@chitranshkumarsinha](https://github.com/chitranshkumarsinha)
