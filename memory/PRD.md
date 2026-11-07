# Tollgate PRD

## Original problem statement
Phase 1: Landing page for B2B SaaS Enterprise AI API Gateway (repo devsecops-capstone-project), anti-slop rules (github.com/miqdadbadjuber/anti-slop).
Phase 2: Frontend Developer Console & Dashboard. Mock state + modular API service hooks (wire to FastAPI later). Collapsible sidebar (expanded / icon rail with tooltips, toggle + shortcut), global command palette (Ctrl/Cmd+K, fuzzy, arrow nav, jump-to and actions: Generate New API Key, Copy Gateway Base URL, Toggle Sidebar). Views: Overview (health strip linked to /health, env badge, 4 metrics, traffic/latency chart, recent requests), API Keys (table, create modal with one-time copy and quota, revoke/delete), Gateway Playground (split pane /v1/chat sandbox, model selector, prompts, strict injection guardrail, JSON response with status, latency, tokens, PASSED/BLOCKED), Security Logs (dense table, status badges, rule triggered). tabular-nums for numbers, no em/en dashes, English UI.

Phase 3: Authentication flow (Sign In, Sign Up, Forgot Password) with mock session, landing CTAs gated, Sign Out in console.

Phase 4: Account menu and profile management. Header account dropdown (session info, plan badge, Profile Settings, Console Settings, Sign Out), Profile Settings modal (edit display name and email, read only user ID and organization ID, inline save feedback), state synced via AuthContext.

## Architecture
- React (craco) + Tailwind, framer-motion, lenis (landing only), cmdk, recharts. Fonts: Schibsted Grotesk + IBM Plex Mono.
- Console code: src/console/ (ConsoleLayout, ConsoleContext, nav.js, components/, pages/, hooks/useGateway.js, services/gatewayApi.js + mockData.js, lib/format.js)
- services/gatewayApi.js is the single swap point for the FastAPI backend.
- Backend: GET /api/health only (used by console health strip).
- Routes: /console -> /console/overview, /console/keys, /console/playground, /console/logs, /console/settings.

## Implemented
- 2026-10-27: Landing page.
- 2026-10-27: Console & dashboard (all views above), Ctrl/Cmd+K palette, Ctrl/Cmd+B sidebar, env switch (live/test) in Settings. Landing "Get API Key" -> /console/keys, "Console" nav link and "Start Building" -> /console.

- 2026-10-27: Auth flow. Routes /auth/sign-in, /auth/sign-up, /auth/forgot-password (src/auth/). RequireAuth guards /console and preserves target (Get API Key -> /console/keys after sign in). GuestOnly redirects signed-in users to /console. Sign out in sidebar footer. Tested 100% (iteration_1).

- 2026-10-27: Account menu (src/console/components/AccountMenu.jsx, Radix dropdown with click outside close) and Profile Settings dialog (ProfileDialog.jsx). AuthContext.updateProfile persists to localStorage and updates header instantly. Sidebar account block removed, sign out lives in the header menu.

## Backend & DevSecOps Plan (TASK.md)
- 2026-10-28: Backend Phase 1 (P0) done and verified: DB init/indexes + seed (lifespan), strict Pydantic schemas, JWT auth (signup/signin/me/profile), lockout, get_current_user / verify_workspace_access / require_roles / verify_api_key_scope, CORS allowlist. Frontend AuthContext uses real API. Tests: backend/tests/test_phase1_auth.py (22/22), iteration_1.
- 2026-10-28: Backend Phase 2 (P1) done and verified: API key CRUD/rotate (HMAC hash + masked prefix, BOLA/BFLA-scoped), guardrail engine (prompt injection incl. base64, PII redaction, toxicity), POST /api/playground/evaluate (JWT) + POST /api/gateway/completions (X-API-Key, chat:write). Upstream LLM via OpenAI-compatible client (backend/guardrails/upstream.py) = PLACEHOLDER until LLM_BASE_URL/LLM_API_KEY/LLM_MODEL set. Tests: backend/tests/test_phase2_keys_gateway.py (28/28).
- 2026-10-28: Upstream LLM connected: Griphub router (OpenAI-compatible, https://griphubrouter.web.id/v1, model deepseek-v4.1-flash). Playground/gateway now return real AI replies (upstream: openai-compatible).
- Phase 3 (P2) done: security logs, metrics, settings, health.
- 2026-10-28: Phase 4 (P3) implemented (NOT tested per user request): Task 4.1 pytest suite in tests/ (auth, BOLA/BFLA/BOPLA, gateway, health, rate limit), Task 4.2 Mongo sliding-window rate limiting (per IP/key/workspace, 429 + Retry-After), Task 4.3 docker/ (multi-stage non-root backend + frontend Dockerfiles, nginx template, docker-compose.yml with monitoring profile, .env.example), Prometheus GET /metrics + monitoring/ (prometheus.yml, alerts.yml, Grafana provisioning + dashboard), k8s/ (namespace PSS restricted, ConfigMap, Secret template, Mongo StatefulSet, backend/frontend Deployments+Services+PDB+HPA, probes, Ingress, NetworkPolicies, ServiceMonitor, kustomization), jenkins/Jenkinsfile (gitleaks, bandit, semgrep, pip-audit, yarn audit, pytest JUnit, SonarQube, docker build, Trivy + SBOM, push, kubectl deploy, ZAP DAST).
- Next: run pytest suite + verify docker/k8s manifests, then Phase 5.

## MOCKED (updated: auth is now real; below still applies to console data)
- Auth is client-side only: session in localStorage `tollgate.session`, accounts (name only) in `tollgate.accounts`, passwords not checked, Google sign-in simulated, profile updates and user/org IDs are local only (IDs derived from email hash), reset email not sent.
- Keys, metrics, traffic, logs, and /v1/chat responses come from in-memory mock client (resets on reload). Health is real.

## Backlog
- P0: FastAPI endpoints for keys, logs, metrics, /v1/chat; swap gatewayApi methods to fetch
- P1: real auth (Emergent-managed email/password + Google) replacing src/auth/AuthContext.jsx, persistent key storage (hashed), log export
- P2: per-key usage drilldown, Dockerfile + nginx

## Update 2026-11-07 (README, tests, endpoint)
- README synced to real state (badge, status, Fase 1-4 checklists, stack React/FastAPI/MongoDB, run & test instructions)
- Removed legacy backend/tests (hardcoded demo password); tests/conftest.py now uses TEST_DB_NAME (default <DB_NAME>_pytest), dropped + seeded once per run
- Gateway unified: POST /api/v1/chat/completions (nginx /v1/* -> /api/v1/*); old /api/gateway/completions removed; model "auto" (default) -> nexus-fast-v1
- pytest: 90/90 pass
- Backlog: OpenAI choices[] response format, real multi-provider routing, rollback stage, Sonar quality gate, pipeline notifications, update ARCHITECTURE.md

## Update 2026-11-07 (Landing SaaS revamp, Phase 1)
- Pricing: 4 plans (Free/Pro/Team/Enterprise) from PLANS in frontend/src/content.js; Monthly/Annual (Save 20%) + USD/IDR toggles; CTAs -> /auth/sign-up?plan&billing&currency, Enterprise -> /contact
- New sections: How it works (3 steps), FAQ (8, accordion), closing CTA; navbar How it works + FAQ; EN/ID copy; no em dash
- Testing agent iteration_1: 95% -> mobile menu scroll offset fixed, USD thousands separator fixed
- Next: Phase 2 real payments (Stripe USD, Midtrans/Xendit IDR) + plan stored on account + quota enforcement; Phase 3 Billing page, quota emails, working Enterprise contact form

## Update 2026-11-07 (Pipeline: cosign signing + evidence report)
- Jenkinsfile: Push records digests (test_reports/supply-chain/*.digest); new stages "Sign & Attest (cosign)" and "Verify Signatures" (gate before deploy); deploy pins verified digests and rejects :latest
- New credentials: cosign-private-key (file), cosign-password (text); cosign.pub placeholder at repo root (verify stage fails while placeholder)
- docs/supply-chain-signing.md (key gen, Jenkins creds, manual verify, rotation); docs/evidence-report.md (16 stages, LOCAL vs WAITING JENKINS, findings F-01..F-08, OWASP API Top 10 mapping); raw local reports in docs/evidence/local/
- Local results: gitleaks 1 false positive (tests/test_auth.py:138), bandit 0 med+, semgrep 0, pip-audit starlette+pymongo vulnerable, yarn audit 11 high, pytest 90/90 cov 96.3%
- Next: fix F-01..F-05, run real Jenkins, fill evidence, Kyverno verifyImages
