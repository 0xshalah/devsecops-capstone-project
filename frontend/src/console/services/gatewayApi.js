// Mock gateway client. Replace each method body with a fetch to the FastAPI backend; signatures stay the same.
import { MODELS, seedKeys, seedLogs, seedTraffic, hex } from "./mockData";

const now = Date.now();
const db = { keys: seedKeys(now), logs: seedLogs(now), traffic: seedTraffic(now) };

const wait = (min = 120, max = 320) => new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
const clone = (v) => JSON.parse(JSON.stringify(v));

const secureHex = (bytes) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("");

const INJECTION = [
  /ignore (all |any )?(the )?(previous|prior|above) instructions/i,
  /disregard (all |your |the )?(rules|instructions|guidelines)/i,
  /reveal (your |the )?(system prompt|hidden instructions)/i,
  /you are now (dan|in developer mode|unrestricted)/i,
  /\bjailbreak\b/i,
];

const estimateTokens = (text) => Math.max(1, Math.ceil(text.trim().length / 4));

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
    await wait();
    return clone(db.keys.filter((k) => k.env === env).sort((a, b) => b.createdAt - a.createdAt));
  },

  async createKey({ name, rpm, quota, env }) {
    await wait(250, 450);
    const secret = `nx_${env}_${secureHex(16)}`;
    const key = { id: `key_${hex(8)}`, name, env, last4: secret.slice(-4), rpm, quota, createdAt: Date.now(), status: "active", lastUsed: null };
    db.keys.unshift(key);
    return { key: clone(key), secret };
  },

  async revokeKey(id) {
    await wait();
    const key = db.keys.find((k) => k.id === id);
    key.status = "revoked";
    return clone(key);
  },

  async deleteKey(id) {
    await wait();
    db.keys = db.keys.filter((k) => k.id !== id);
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
    const started = performance.now();
    const match = INJECTION.map((re) => prompt.match(re) || system.match(re)).find(Boolean);
    const blocked = strict && Boolean(match);
    await wait(blocked ? 20 : 180, blocked ? 60 : 520);
    const latency = Math.round(performance.now() - started);
    const requestId = `req_${hex(12)}`;
    const promptTokens = estimateTokens(`${system} ${prompt}`);
    const route = MODELS.find((m) => m.id === model)?.route;

    if (blocked) {
      const rule = "Prompt Injection Filter: Blocked keyword detected";
      db.logs.unshift({ id: requestId, ts: Date.now(), endpoint: "/v1/chat", model, key: "playground", status: 403, latency, tokens: 0, rule });
      return {
        status: 403,
        latency,
        tokens: { prompt: promptTokens, completion: 0, total: promptTokens },
        guardrail: { status: "BLOCKED", rule, match: match[0] },
        body: { error: { type: "guardrail_violation", code: 403, rule: "prompt_injection_filter", message: `Blocked keyword detected: "${match[0]}"`, request_id: requestId } },
      };
    }

    const content = `Sample response from ${model}. The gateway is not wired to a provider yet, so this text is generated locally. Your request used about ${promptTokens} prompt tokens.`;
    const completionTokens = estimateTokens(content);
    const rule = match ? "Prompt Injection Filter: Pattern matched, monitor mode" : null;
    db.logs.unshift({ id: requestId, ts: Date.now(), endpoint: "/v1/chat", model, key: "playground", status: 200, latency, tokens: promptTokens + completionTokens, rule });
    return {
      status: 200,
      latency,
      tokens: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens },
      guardrail: { status: "PASSED", rule, match: match?.[0] || null },
      body: {
        id: `chatcmpl_${hex(16)}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model,
        route,
        choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
        usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens },
        guardrail: { strict, result: "passed", flagged: Boolean(match) },
        request_id: requestId,
      },
    };
  },
};
