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
- Next: Phase 2 (API keys CRUD, guardrail engine, playground/gateway endpoints).

## MOCKED (updated: auth is now real; below still applies to console data)
- Auth is client-side only: session in localStorage `tollgate.session`, accounts (name only) in `tollgate.accounts`, passwords not checked, Google sign-in simulated, profile updates and user/org IDs are local only (IDs derived from email hash), reset email not sent.
- Keys, metrics, traffic, logs, and /v1/chat responses come from in-memory mock client (resets on reload). Health is real.

## Backlog
- P0: FastAPI endpoints for keys, logs, metrics, /v1/chat; swap gatewayApi methods to fetch
- P1: real auth (Emergent-managed email/password + Google) replacing src/auth/AuthContext.jsx, persistent key storage (hashed), log export
- P2: per-key usage drilldown, Dockerfile + nginx
