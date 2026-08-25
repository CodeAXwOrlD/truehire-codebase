# Memory.md — TrueHire progress log

Purpose: read by the AI coding tool at the start of every session so it does not waste tokens re-reading the whole codebase or re-deciding settled things. Update at the end of every work session — a log, not a report.

**How to update:** append to "Decisions log" and "Session log," update "Current phase" and "Known open questions." Do not rewrite history — if a decision changes, add a new entry noting what changed and why.

---

## Current phase
Phase 6 COMPLETE.
- Phase 6: AI Match-Score Engine & Resume Parsing via Python FastAPI microservice, Candidate Profile & Tech Stack Manager, Dynamic Match % Badges on live job board, Match Breakdown Explainability Modal (Matched skills, Missing skills, Tailoring tips), and Candidate Application Pipeline.
- Next Phase: Phase 7 (Interactive Analytics Cohorts & Funnel Visualizations) & Phase 8 (Production Deployment Hardening).

## Decisions log
*(most recent first)*

- **Meta WhatsApp Cloud API Free OTP & Modern Box Auth UI implemented (v2):** Added 100% free WhatsApp OTP verification (~1,000 free conversations/month on Meta Graph API). Built 6-box auto-focus OTP component with paste support, dual sign-in tabs (WhatsApp 1-Click vs Password), and holographic Verified Beacon login/unlock success animation.
- **AI Match-Score Architecture implemented (v2):** Python FastAPI microservice extracts skills via NLP regex dictionary matching from raw resume/bio text. Calculates compatibility score (0-100%) against job titles, tags, and job descriptions with breakdown of matched vs missing competencies.
- **Candidate Skill Profile & Match UI locked (v1):** Live Job Board (/jobs) displays glowing Teal Match Badge (e.g. 90% Match) on every listing. Candidate can open "My Skills" modal to customize tech stack and trigger live match recomputation. Match Breakdown Modal displays matched skills, missing skills, and interview tailoring tips.
- **Live Multi-Source Job Aggregator Engine implemented (v2):** Aggregates live jobs from public APIs (RemoteOK, Arbeitnow, YC/HN), normalizes them into unified schema, automatically scores every job via internal Python scoring service, and broadcasts real-time updates to connected candidate clients via SSE.
- **Inter-service security locked (v2):** Node.js signs requests to Python scoring service using HMAC-SHA256 over timestamp + body with SERVICE_SHARED_SECRET. Python service validates signature and timestamp window to reject unauthorized or replay requests.
- **Design system finalized (v1, unchanged):** flat zinc/black base (#0A0A0B), hairline borders, teal #2FBFA8 / amber #D69A45 / red #D9564D status colors only, Inter + JetBrains Mono.

## Session log
*(append one entry per work session)*

- **Session 0 (planning):** Wrote PRD.md, Architecture.md v1, Rules.md v1, Phases.md v1, Design.md. Finalized visual design system and logo direction.
- **Session 1 (architecture revision + scaffold):** Monorepo scaffolding across 3 services.
- **Session 2 (Phase 1 frontend auth):** Built sign-up, verify (OTP), and sign-in pages in frontend/app/(auth)/.
- **Session 3 (Phase 2 & Phase 3 Requisitions):** Built Requisitions CRUD, detail pipeline Kanban, and recruiter dashboard home.
- **Session 4 (Phase 4 & Phase 5 Live Job Board + Ghost-Score Engine):** Built Python Ghost-Score calculation & explainability engine, Node HMAC-SHA256 service client, Multi-source live job aggregator & SSE streamer, Candidate Live Job Board (/jobs) with multi-filters and detail drawer.
- **Session 5 (Phase 6 AI Match-Score Engine & Resume Parsing):** Implemented Python NLP resume parser & match score heuristic router, Node candidate routes, Candidate Skills & Profile Modal, dynamic Match % badges across live jobs, and Match Breakdown modal. All services verified with 0 errors.
- **Session 6 (WhatsApp Cloud API & Fancy Box OTP UI):** Implemented WhatsApp Cloud API integration in Node API, 6-slot Box OTP Input component with auto-focus & clipboard paste, and holographic biometric Verified Beacon unlock animation. Verified with 0 build errors.

## Known open questions
- PDF/DOCX binary file upload direct extraction via PyPDF2 / pdfplumber.
