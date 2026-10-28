// Keys and playground use the FastAPI backend. Overview and logs stay on seeded mock data until Phase 3.
import { apiRequest } from "@/lib/apiClient";
import { seedLogs, seedTraffic } from "./mockData";

const now = Date.now();
const db = { logs: seedLogs(now), traffic: seedTraffic(now) };

const wait = (min = 120, max = 320) => new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
const clone = (v) => JSON.parse(JSON.stringify(v));

const toKey = (k) => ({
  ...k,
  rpm: k.rateLimit,
  createdAt: Date.parse(k.createdAt),
  lastUsed: k.lastUsed ? Date.parse(k.lastUsed) : null,
});

const GUARDRAIL = { blocked: "BLOCKED", redacted: "REDACTED", allowed: "PASSED" };

const summarize = () => {
  const t = db.traffic;
  const total = t.reduce((s, d) => s + d.requests, 0);
  return {
    totalRequests: total,
    tokenVolume: t.reduce((s, d) => s + d.tokens, 0),
    avgLatency: Math.round(t.reduce((s, d) => s + d.latency * d.requests, 0) / total),
    guardrailBlocks: t.reduce((s, d) => s + d.blocks, 0),
  };
};

const topRules = () => {
  const counts = {};
  db.logs.filter((l) => l.status === 403).forEach((l) => { counts[l.rule] = (counts[l.rule] || 0) + 1; });
  return Object.entries(counts).map(([rule, count]) => ({ rule, count })).sort((a, b) => b.count - a.count);
};

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
    await wait();
    return clone({ metrics: summarize(), traffic: db.traffic, recent: db.logs.slice(0, 8), topRules: topRules() });
  },

  async listLogs() {
    await wait();
    return clone(db.logs);
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
