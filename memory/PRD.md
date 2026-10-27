# Tollgate PRD

## Original problem statement
Phase 1: Landing page for B2B SaaS Enterprise AI API Gateway (repo devsecops-capstone-project), anti-slop rules (github.com/miqdadbadjuber/anti-slop).
Phase 2: Frontend Developer Console & Dashboard. Mock state + modular API service hooks (wire to FastAPI later). Collapsible sidebar (expanded / icon rail with tooltips, toggle + shortcut), global command palette (Ctrl/Cmd+K, fuzzy, arrow nav, jump-to and actions: Generate New API Key, Copy Gateway Base URL, Toggle Sidebar). Views: Overview (health strip linked to /health, env badge, 4 metrics, traffic/latency chart, recent requests), API Keys (table, create modal with one-time copy and quota, revoke/delete), Gateway Playground (split pane /v1/chat sandbox, model selector, prompts, strict injection guardrail, JSON response with status, latency, tokens, PASSED/BLOCKED), Security Logs (dense table, status badges, rule triggered). tabular-nums for numbers, no em/en dashes, English UI.

## Architecture
- React (craco) + Tailwind, framer-motion, lenis (landing only), cmdk, recharts. Fonts: Schibsted Grotesk + IBM Plex Mono.
- Console code: src/console/ (ConsoleLayout, ConsoleContext, nav.js, components/, pages/, hooks/useGateway.js, services/gatewayApi.js + mockData.js, lib/format.js)
- services/gatewayApi.js is the single swap point for the FastAPI backend.
- Backend: GET /api/health only (used by console health strip).
- Routes: /console -> /console/overview, /console/keys, /console/playground, /console/logs, /console/settings.

## Implemented
- 2026-10-27: Landing page.
- 2026-10-27: Console & dashboard (all views above), Ctrl/Cmd+K palette, Ctrl/Cmd+B sidebar, env switch (live/test) in Settings. Landing "Get API Key" -> /console/keys, "Console" nav link and "Start Building" -> /console.

## MOCKED
- Keys, metrics, traffic, logs, and /v1/chat responses come from in-memory mock client (resets on reload). Health is real.

## Backlog
- P0: FastAPI endpoints for keys, logs, metrics, /v1/chat; swap gatewayApi methods to fetch
- P1: auth for console, persistent key storage (hashed), log export
- P2: per-key usage drilldown, Dockerfile + nginx
