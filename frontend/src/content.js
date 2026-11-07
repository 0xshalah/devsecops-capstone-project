// Values in [brackets] are placeholders to replace before launch.
export const LINKS = {
  docs: "/docs",
  console: "/console",
  consoleKeys: "/console/keys",
  contact: "/contact",
  signup: "/auth/sign-up",
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

// Single source for plan prices and quotas. IDR is a fixed rounded price list, not a live FX conversion.
// annual = price per month when billed yearly (about 20% off). null = contact sales.
export const PLANS = [
  { id: "free", quota: 10000, price: { usd: { monthly: 0, annual: 0 }, idr: { monthly: 0, annual: 0 } } },
  { id: "pro", quota: 250000, price: { usd: { monthly: 49, annual: 39 }, idr: { monthly: 790000, annual: 629000 } } },
  { id: "team", quota: 2000000, featured: true, price: { usd: { monthly: 199, annual: 159 }, idr: { monthly: 3190000, annual: 2549000 } } },
  { id: "enterprise", quota: null, price: null },
];
