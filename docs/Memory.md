# Memory.md — TrueHire progress log

Purpose: read by the AI coding tool at the start of every session so it does not waste tokens re-reading the whole codebase or re-deciding settled things. Update at the end of every work session — a log, not a report.

**How to update:** append to "Decisions log" and "Session log," update "Current phase" and "Known open questions." Do not rewrite history — if a decision changes, add a new entry noting what changed and why.

---

## Current phase
Phase 4 & Phase 5 COMPLETE.
- Phase 4: Ghost-Score Engine in FastAPI Python microservice with HMAC-SHA256 signature inter-service security, explainability calculations, and Node API proxy client.
- Phase 5: Candidate Live Job Board with Multi-Source Aggregation (RemoteOK, Arbeitnow, YC, LinkedIn), Server-Sent Events (SSE) real-time streaming, multi-dimensional filters (Remote only, Ghost risk slider, platform source tabs, tech stack tags), Verified Beacon risk pills, "Why this score?" explainability modal, and candidate application tracker.
- Next Phase: Phase 6 (AI Match-Score Engine & Resume Parsing via Python NLP) & Phase 7 (Interactive Analytics Cohorts).

## Decisions log
*(most recent first)*

- **Live Multi-Source Job Aggregator Engine implemented (v2):** Aggregates live jobs from public APIs (RemoteOK, Arbeitnow, YC/HN), normalizes them into unified schema, automatically scores every job via internal Python scoring service, and broadcasts real-time updates to connected candidate clients via SSE.
- **Inter-service security locked (v2):** Node.js signs requests to Python scoring service using HMAC-SHA256 over timestamp + body with SERVICE_SHARED_SECRET. Python service validates signature and timestamp window to reject unauthorized or replay requests.
- **Candidate UI locked (v1):** Live Job Board (/jobs) with real-time stream status, instant multi-filters, Ghost-Score risk pills (Low <30, Medium 30-65, High >65), Explainability Modal, and Application Tracker (/applications).
- **Requisitions & Pipeline architecture implemented (v2):** Full CRUD on backend-node with Prisma + Zod validation. Requisitions support event logging (interview, offer, activity) to feed ghost-score heuristics.
- **Design system finalized (v1, unchanged):** flat zinc/black base (#0A0A0B), hairline borders, teal #2FBFA8 / amber #D69A45 / red #D9564D status colors only, Inter + JetBrains Mono.

## Session log
*(append one entry per work session)*

- **Session 0 (planning):** Wrote PRD.md, Architecture.md v1, Rules.md v1, Phases.md v1, Design.md. Finalized visual design system and logo direction.
- **Session 1 (architecture revision + scaffold):** Monorepo scaffolding across 3 services.
- **Session 2 (Phase 1 frontend auth):** Built sign-up, verify (OTP), and sign-in pages in frontend/app/(auth)/.
- **Session 3 (Phase 2 & Phase 3 Requisitions):** Built Requisitions CRUD, detail pipeline Kanban, and recruiter dashboard home.
- **Session 4 (Phase 4 & Phase 5 Live Job Board + Ghost-Score Engine):** Built Python Ghost-Score calculation & explainability engine, Node HMAC-SHA256 service client, Multi-source live job aggregator & SSE streamer, Candidate Live Job Board (/jobs) with multi-filters and detail drawer, "Why this score?" explainability modal, and candidate application tracker (/applications). All 12 Next.js routes, Node API, and FastAPI Python microservice pass with 0 errors.

## Known open questions
- AI resume parsing (PDF/DOCX) and semantic embedding comparisons for Phase 6 match-score engine.
