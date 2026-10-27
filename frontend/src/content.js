// Values in [brackets] are placeholders to replace before launch.
export const LINKS = {
  docs: "/docs",
  console: "/console",
  contact: "/contact",
  security: "/security",
  health: "/health",
  github: "https://github.com/[your-org]/devsecops-capstone-project",
};

export const MARQUEE = [
  "POST /v1/chat/completions",
  "OpenAI",
  "Anthropic",
  "Local models",
  "Automatic failover",
  "Prompt injection filter",
  "Payload redaction",
  "Per-key rate limits",
  "Token accounting",
];

export const TIERS = [
  {
    id: "developer-free",
    name: "Developer",
    price: "$0",
    unit: "per month",
    note: "For prototypes and side projects.",
    items: ["[10] requests per second", "[24 hours] log retention", "Default guardrail set", "Community support"],
    cta: "Create free key",
    href: LINKS.console,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$[X]",
    unit: "per month",
    note: "For teams shipping to production.",
    items: ["[100] requests per second", "[30 days] log retention", "Custom guardrail rules", "Per-key budgets and alerts"],
    cta: "Choose Pro",
    href: LINKS.console,
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    unit: "annual contract",
    note: "For regulated workloads.",
    items: ["Dedicated throughput", "[1 year] audit log retention", "Custom guardrails with policy review", "Private networking options"],
    cta: "Talk to sales",
    href: LINKS.contact,
  },
];
