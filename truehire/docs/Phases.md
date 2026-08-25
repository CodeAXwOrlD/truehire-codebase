# Phases.md — TrueHire build plan (v2)

Each phase should be completable and demoable on its own. Don't start a phase until the previous one's checklist is done. Update Memory.md at the end of every phase.

## Phase 0 — Project setup (monorepo, 3 services)
- [ ] `frontend/` — Next.js (App Router, TS) initialized, shadcn init, Tailwind tokens match Design.md
- [ ] `backend-node/` — Express + TS project initialized, Prisma initialized, connected to Supabase Postgres via connection string
- [ ] `scoring-service-python/` — FastAPI project initialized, `requirements.txt`, connects to same Postgres
- [ ] Supabase project created — **Postgres + Storage only**, no Edge Functions used
- [ ] `.env.example` present in all three services, `.env` gitignored everywhere
- [ ] Fonts (Inter, JetBrains Mono) wired via `next/font`
- **Demo:** all three services run locally (`frontend` on :3000, `backend-node` on :4000, `scoring-service-python` on :8000), Node API health-checks the DB, Python health-checks the DB

## Phase 1 — Auth & roles (self-built, full verification)
- [ ] `users`, `refresh_tokens`, `otp_codes` tables (Prisma migration)
- [ ] Signup route: bcrypt hash, `email_verified = false`
- [ ] Email OTP verification flow (Nodemailer/Resend)
- [ ] Login route: JWT access token + httpOnly refresh cookie, blocked until verified
- [ ] Refresh + logout routes (rotation, revocation)
- [ ] Rate limiting on all `/auth/*` routes
- [ ] Sign-in / sign-up / verify pages (frontend, per Design.md)
- [ ] Role selection (candidate vs. recruiter) on first sign-up
- **Demo:** a user signs up, receives a verification code, verifies, logs in, gets a working session; expired/invalid tokens are handled correctly

## Phase 2 — Dashboard shell (recruiter side)
- [ ] Sidebar nav with sliding hover indicator
- [ ] Topbar with search + command palette (Cmd+K)
- [ ] Empty-state dashboard home
- [ ] Auth-protected routes (middleware checks JWT, redirects if missing/expired)
- **Demo:** recruiter logs in, sees the shell with working nav, no real data yet

## Phase 3 — Requisitions module
- [ ] `requisitions` + `requisition_events` tables/migrations (Prisma)
- [ ] Node API: create/edit/list requisition routes (Zod-validated)
- [ ] Requisition list/table UI (hairline rows, hover spotlight, risk pill, match bar)
- [ ] Requisition detail page with candidate pipeline
- **Demo:** recruiter can create a requisition, log interview/offer events, see it in the list

## Phase 4 — Ghost-score engine (Python service)
- [ ] `scoring-service-python`: `/score/ghost` endpoint — heuristic calc (days open vs typical window, interviews vs offers)
- [ ] `ghost_scores` table, scheduled recompute (node-cron in Node API calling Python, or a small cron container)
- [ ] Node API: `/scoring/*` routes that proxy to Python with signed service header
- [ ] Risk signal card component (ring + stats) wired to real data
- [ ] `/explain-score` endpoint + "Why this score?" panel
- **Demo:** a stale requisition surfaces a real, explainable risk signal on the dashboard; Node→Python call verified via signed header in logs

## Phase 5 — Candidate-facing job board
- [ ] Public job listing pages (SSR), search + filters
- [ ] Ghost-score badge on listing cards
- [ ] Job detail page
- [ ] Candidate resume upload → Supabase Storage (via signed URL issued by Node API, not direct browser-to-Supabase)
- **Demo:** anonymous visitor browses/filters listings; signed-up candidate uploads a resume

## Phase 6 — Match-score engine (Python service)
- [ ] `scoring-service-python`: `/parse-resume` + `/score/match` endpoints
- [ ] Match % surfaced on listing cards/detail for logged-in candidates
- [ ] Application tracker (applied → interview → offer/reject, "days since last activity")
- **Demo:** candidate sees real match percentages, tracks an application's timeline

## Phase 7 — Analytics
- [ ] Recruiter analytics: time-to-fill, risk trend, pipeline conversion
- [ ] Charts (recharts, zinc/teal tokens)
- **Demo:** recruiter dashboard shows real trend data

## Phase 8 — Polish & hardening
- [ ] Loading/empty/error states audited across every screen
- [ ] Accessibility pass (focus states, keyboard nav, contrast)
- [ ] Animation audit — no ambient/looping motion snuck in
- [ ] Security checklist from Rules.md §7 run end-to-end
- [ ] Load-test the scoring endpoints separately from the CRUD endpoints (confirms independent scaling actually helps)
- **Demo:** feature-complete MVP, ready for external users/interview walkthrough

## Phase 9 — Deployment
- [ ] Production Supabase project (Postgres + Storage) + migrations applied
- [ ] `backend-node` deployed (Railway/Render/Fly.io)
- [ ] `scoring-service-python` deployed as a separate service
- [ ] `frontend` deployed on Vercel, env vars configured, pointed at production Node API
- [ ] Smoke test candidate + recruiter flows, plus a direct check that the Python service is unreachable from the public internet
