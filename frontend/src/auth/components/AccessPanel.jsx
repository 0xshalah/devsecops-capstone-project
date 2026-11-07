import { NAV, GATEWAY_BASE_URL } from "@/console/nav";

const DESCRIPTIONS = {
  overview: "Request volume, latency and recent calls for the active environment.",
  keys: "Create, copy once, and revoke gateway keys with per-key quotas.",
  playground: "Send test prompts to /v1/chat/completions and inspect the guardrail verdict.",
  logs: "Requests the guardrails blocked, with the rule that triggered.",
  settings: "Switch between live and test environments.",
};

export const AccessPanel = () => (
  <aside data-testid="auth-access-panel" className="hidden border-l border-[var(--line)] bg-[#0b0b0d] lg:flex lg:flex-col lg:justify-center lg:px-14 xl:px-20">
    <p className="font-mono text-xs text-zinc-400">
      <span className="text-[var(--accent)]">base_url</span> {GATEWAY_BASE_URL}
    </p>
    <h2 className="mt-5 max-w-sm font-display text-2xl font-semibold leading-snug tracking-[-0.02em] text-zinc-100">
      What your console account opens
    </h2>
    <ul className="mt-10 max-w-md border-t border-[var(--line)]">
      {NAV.map(({ id, label, slug, icon: Icon }) => (
        <li key={id} className="grid grid-cols-[20px_1fr] gap-4 border-b border-[var(--line)] py-4">
          <Icon className="mt-0.5 h-4 w-4 text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
          <div>
            <p className="flex items-baseline gap-2 text-sm font-medium text-zinc-200">
              {label}
              <span className="font-mono text-[11px] font-normal text-zinc-500">/{slug}</span>
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">{DESCRIPTIONS[id]}</p>
          </div>
        </li>
      ))}
    </ul>
  </aside>
);
