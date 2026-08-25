# Memory.md — TrueHire progress log

Purpose: read by the AI coding tool at the start of every session so it does not waste tokens re-reading the whole codebase or re-deciding settled things. Update at the end of every work session — a log, not a report.

**How to update:** append to "Decisions log" and "Session log," update "Current phase" and "Known open questions." Do not rewrite history — if a decision changes, add a new entry noting what changed and why.

---

## Current phase
Phase 2 & Phase 3 COMPLETE.
- Phase 2: Recruiter Dashboard Shell (Topbar, Sidebar, Command Palette Cmd+K, Navigation, Responsive Layout) is fully built and verified.
- Phase 3: Requisitions Module (Full CRUD backend API routes, Zod validation, events logger, Requisition table UI with hairline rows and spotlight hover, Create Requisition Modal, Requisition Detail & Pipeline Kanban view, and Analytics overview) is fully implemented and compiled.
- Next Phase: Phase 4 (Ghost-Score Engine in Python FastAPI service) & Phase 5 (Candidate Job Board & Real-Time Live Job Feed).

## Decisions log
*(most recent first)*

- **Requisitions & Pipeline architecture implemented (v2):** Built full CRUD on backend-node with Prisma + Zod validation. Requisitions support event logging (interview, offer, activity) to feed ghost-score heuristics in Phase 4.
- **Frontend Requisitions UI locked:** Hairline borders, Zinc surfaces (#0A0A0B), Teal accents, status pills (open, paused, closed), and Ghost-Risk indicators. Detail view includes candidate pipeline stages (Applied -> Reviewed -> Interview -> Offer -> Rejected).
- **Backend architecture changed (v2):** moved off Supabase Edge Functions entirely. Supabase is now DB (Postgres) + Storage only. Business logic split into two owned services: backend-node (Express + TypeScript + Prisma) and scoring-service-python (FastAPI).
- **Auth changed (v2):** self-built system — bcrypt password hashing, JWT access token (15 min) + rotated hashed refresh token (7 day, httpOnly cookie), email OTP verification required before login, rate limiting on all auth routes.
- **Design system finalized (v1, unchanged):** flat zinc/black base (#0A0A0B), hairline borders, teal #2FBFA8 / amber #D69A45 / red #D9564D status colors only, Inter + JetBrains Mono.

## Session log
*(append one entry per work session)*

- **Session 0 (planning):** Wrote PRD.md, Architecture.md v1, Rules.md v1, Phases.md v1, Design.md. Finalized visual design system and logo direction.
- **Session 1 (architecture revision + scaffold):** Monorepo scaffolding across 3 services.
- **Session 2 (Phase 1 frontend auth):** Built sign-up, verify (OTP), and sign-in pages in frontend/app/(auth)/.
- **Session 3 (Phase 2 & Phase 3 Requisitions):** Implemented full backend CRUD & event logging in backend-node/src/routes/requisitions.routes.ts. Built Requisitions Table with status filters & search, CreateRequisitionModal, Requisition Detail view with candidate pipeline and activity timeline, updated Dashboard Home with dynamic metrics, and created hiring velocity analytics overview. Both frontend and backend compile and build with 0 errors. Next: Phase 4 & Phase 5 (Ghost-Score Engine & Candidate Live Job Board).

## Known open questions
- Realtime job scraping & ingestion pipeline (RemoteOK, Arbeitnow, YC, LinkedIn) for Phase 5 candidate job board.
- Heuristic weighting for ghost-score in Python scoring service (Phase 4).
