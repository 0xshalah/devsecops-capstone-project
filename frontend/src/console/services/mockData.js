// Seeded sample data for the console until the FastAPI endpoints exist.
export const MODELS = [
  { id: "nexus-fast-v1", route: "nexus", note: "Lowest latency" },
  { id: "gpt-4o-route", route: "openai", note: "Routes to OpenAI" },
  { id: "claude-route", route: "anthropic", note: "Routes to Anthropic" },
];

export const ENDPOINTS = ["/v1/chat", "/v1/chat/completions", "/v1/embeddings"];

export const RULES_BLOCK = [
  "Prompt Injection Filter: Blocked keyword detected",
  "Prompt Injection Filter: Role override attempt",
  "PII Guard: Credit card number in prompt",
  "Domain Denylist: Blocked URL in prompt",
];
export const RULE_REDACT = "PII Redaction: 1 email address masked";
export const RULE_RATE = "Rate Limit: Key exceeded RPM budget";

const MIN = 60e3;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const hex = (n, r = Math.random) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join("");

const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
const between = (min, max, r) => Math.round(min + r() * (max - min));

export const seedKeys = (now) => [
  { id: "key_01", name: "production-backend", env: "live", last4: "8f9a", rpm: 3000, quota: 50000000, createdAt: now - 41 * DAY, status: "active", lastUsed: now - 2 * MIN },
  { id: "key_02", name: "analytics-batch", env: "live", last4: "47d0", rpm: 600, quota: 20000000, createdAt: now - 9 * DAY, status: "active", lastUsed: now - 26 * MIN },
  { id: "key_03", name: "legacy-mobile", env: "live", last4: "b3a7", rpm: 60, quota: 1000000, createdAt: now - 88 * DAY, status: "revoked", lastUsed: now - 30 * DAY },
  { id: "key_04", name: "staging-worker", env: "test", last4: "c21e", rpm: 600, quota: 5000000, createdAt: now - 19 * DAY, status: "active", lastUsed: now - 3 * HOUR },
];

export const seedLogs = (now) => {
  const r = rng(7);
  const keys = ["production-backend", "analytics-batch", "production-backend", "staging-worker"];
  return Array.from({ length: 90 }, (_, i) => {
    const roll = r();
    const status = roll < 0.8 ? 200 : roll < 0.93 ? 403 : 429;
    const base = { id: `req_${hex(12, r)}`, ts: now - Math.floor(i * 16 * MIN + r() * MIN), endpoint: pick(ENDPOINTS, r), model: pick(MODELS, r).id, key: pick(keys, r), status };
    if (status === 403) return { ...base, latency: between(3, 12, r), tokens: 0, rule: pick(RULES_BLOCK, r) };
    if (status === 429) return { ...base, latency: between(1, 3, r), tokens: 0, rule: RULE_RATE };
    return { ...base, latency: between(38, 260, r), tokens: between(120, 2400, r), rule: r() < 0.14 ? RULE_REDACT : null };
  });
};

export const seedTraffic = (now) => {
  const r = rng(21);
  const end = Math.floor(now / HOUR) * HOUR;
  return Array.from({ length: 24 }, (_, i) => {
    const t = end - (23 - i) * HOUR;
    const h = new Date(t).getUTCHours();
    const shape = 0.55 + 0.45 * Math.sin(((h - 8) / 24) * 2 * Math.PI);
    const requests = Math.round(2600 + 5200 * shape + r() * 700);
    return {
      t,
      requests,
      latency: Math.round(38 + 22 * shape + r() * 14),
      blocks: Math.round(requests * (0.009 + r() * 0.006)),
      tokens: requests * (380 + Math.floor(r() * 90)),
    };
  });
};
