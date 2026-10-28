// Every console view reads from the FastAPI backend.
import { apiRequest } from "@/lib/apiClient";

const toKey = (k) => ({
  ...k,
  rpm: k.rateLimit,
  createdAt: Date.parse(k.createdAt),
  lastUsed: k.lastUsed ? Date.parse(k.lastUsed) : null,
});

const toLog = (l) => ({ ...l, ts: Date.parse(l.ts) });
const toBucket = (b) => ({ ...b, t: Date.parse(b.t) });

const qs = (params) => new URLSearchParams(
  Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"),
).toString();

const GUARDRAIL = { blocked: "BLOCKED", redacted: "REDACTED", allowed: "PASSED" };

export const gatewayApi = {
  async listKeys(env) {
    return (await apiRequest(`/keys?env=${encodeURIComponent(env)}`)).map(toKey);
  },

  async createKey({ name, rpm, quota, env, scopes }) {
    const res = await apiRequest("/keys", { method: "POST", body: { name, env, scopes, rateLimit: rpm, quota } });
    return { key: toKey(res.key), secret: res.secret };
  },

  async rotateKey(id) {
    const res = await apiRequest(`/keys/${id}/rotate`, { method: "POST" });
    return { key: toKey(res.key), secret: res.secret };
  },

  async revokeKey(id) {
    return toKey(await apiRequest(`/keys/${id}`, { method: "PATCH", body: { status: "revoked" } }));
  },

  async deleteKey(id) {
    return apiRequest(`/keys/${id}`, { method: "DELETE" });
  },

  async getOverview() {
    const [m, traffic, recent] = await Promise.all([
      apiRequest("/metrics/overview?window=24h"),
      apiRequest("/metrics/traffic?granularity=hour&buckets=24"),
      apiRequest("/logs?limit=8"),
    ]);
    return {
      metrics: {
        totalRequests: m.totalRequests, tokenVolume: m.tokenVolume, avgLatency: m.avgLatencyMs,
        guardrailBlocks: m.blockedCount, blockedPct: m.blockedPct, flagged: m.flaggedCount, activeKeys: m.activeKeys,
      },
      traffic: traffic.map(toBucket),
      recent: recent.items.map(toLog),
      topRules: m.topRules,
    };
  },

  async listLogs({ q, status, severity, page, limit } = {}) {
    const res = await apiRequest(`/logs?${qs({ q, status, severity, page, limit })}`);
    return { ...res, items: res.items.map(toLog) };
  },

  getSettings() {
    return apiRequest("/settings");
  },

  updateSettings(body) {
    return apiRequest("/settings", { method: "PUT", body });
  },

  async sendChat({ model, system, prompt, strict }) {
    const r = await apiRequest("/playground/evaluate", { method: "POST", body: { model, system, prompt, strict } });
    const top = r.detectedThreats[0];
    return {
      status: r.httpStatus,
      latency: r.latencyMs,
      tokens: r.tokens,
      guardrail: { status: GUARDRAIL[r.status], rule: top?.rule || null, match: top?.match || null, flagged: r.flagged },
      body: r,
    };
  },
};
