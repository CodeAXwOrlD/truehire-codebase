# TrueHire — Monorepo

Two-sided hiring platform: ghost-job risk scoring for candidates, requisition risk signals for recruiters.

## Structure

```
truehire/
  docs/                     PRD, Architecture, Rules, Phases, Design, Memory
  frontend/                 Next.js 14 (App Router, TS) — UI + logo/brand components
  backend-node/             Express + TypeScript + Prisma — auth, CRUD, orchestration
  scoring-service-python/   FastAPI — resume parsing, ghost-score, match-score
```

Supabase is used **only** for Postgres (DB) and Storage (resume files, logos) — not Auth, not Edge Functions. All business logic lives in `backend-node` and `scoring-service-python`.

## Quick start (local dev)

You'll need: Node 18+, Python 3.11+, and a free Supabase project (for the Postgres connection string + Storage bucket).

### 1. Database
Create a Supabase project → copy the Postgres connection string (Project Settings → Database) and the Storage bucket name you create for resumes.

### 2. backend-node
```bash
cd backend-node
cp .env.example .env      # fill in DATABASE_URL, JWT secrets, SMTP creds, SERVICE_SHARED_SECRET
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev                # http://localhost:4000
```

### 3. scoring-service-python
```bash
cd scoring-service-python
cp .env.example .env      # fill in DATABASE_URL, SERVICE_SHARED_SECRET (must match backend-node's)
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # http://localhost:8000
```

### 4. frontend
```bash
cd frontend
cp .env.example .env.local   # fill in NEXT_PUBLIC_API_URL (points at backend-node)
npm install
npm run dev                  # http://localhost:3000
```

## Security notes
- Never commit `.env` files — only `.env.example` is tracked.
- `SERVICE_SHARED_SECRET` must be identical in `backend-node` and `scoring-service-python` — it's used to HMAC-sign internal requests between them. Rotate it per environment (dev/staging/prod each get their own).
- JWT secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) should be long, random, and different from each other and from `SERVICE_SHARED_SECRET`. Generate with e.g. `openssl rand -base64 48`.
- The Python service should never be exposed on a public port in production — only reachable from `backend-node` over a private network.

## Docs
Read `docs/Memory.md` first in any new session — it has the current state, decisions log, and open questions so you don't have to re-derive context from the whole codebase.

See `docs/Architecture.md` for the full system design, `docs/Rules.md` for what's allowed/not allowed, `docs/Phases.md` for the build order, and `docs/Design.md` for every visual token.
