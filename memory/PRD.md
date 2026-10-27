# Tollgate landing page PRD

## Original problem statement
Build ONLY the frontend landing page for a B2B SaaS Enterprise AI API Gateway (repo devsecops-capstone-project). Follow github.com/miqdadbadjuber/anti-slop: no neon gradients, blobs, sparkle/robot icons; restrained palette with one accent; no buzzwords (Unleash, Revolutionize, Supercharge, Next-Gen, Elevate, Seamless, Empower); no em/en dashes; no fake testimonials, logos or metrics. Sections: navbar (wordmark, Features, Documentation, Pricing, Get API Key), hero (technical headline, 2-line subhead, Start Building + Read the Docs, interactive terminal hitting /v1/chat/completions with JSON response), 3 capabilities (Unified Model Routing, Prompt Guardrails, Token & Cost Governance), 3-tier pricing, footer (All Systems Operational badge linked to /health, API Docs, GitHub, Security Policy). Responsive, lightweight, Docker/K8s friendly.

## Architecture
- React (CRA/craco) + Tailwind, framer-motion, lenis. Fonts: Schibsted Grotesk + IBM Plex Mono (Google Fonts).
- Content and placeholder values: src/content.js. Snippets: src/components/snippets.js.
- Backend: only GET /api/health (pings Mongo) for the status badge and /health page.
- Routes: /, /health, /docs, /console, /contact, /security (placeholders).

## Implemented (2026-10-27)
- Navbar with mobile menu, masked line reveal hero, scroll parallax, tilting terminal (cURL/Node/Python tabs, Copy, Run with example response)
- Editorial marquee, bento capabilities with routing/guardrail/meter visuals and spotlight photo, 3-tier pricing, footer with live status badge
- Favicon/logo SVG mark

## Placeholders
- Pro price $[X], all [bracketed] limits, GitHub org URL, docs/console/sales/security pages, gateway host gateway.tollgate.example

## Backlog
- P1: real docs content, real console link, final prices
- P2: Dockerfile + nginx config for static build, SEO meta/OG
