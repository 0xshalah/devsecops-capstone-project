import Placeholder from "@/pages/Placeholder";
import { useHealth } from "@/components/StatusBadge";

const DOT = { ok: "bg-emerald-400", placeholder: "bg-amber-400" };

const fmtUptime = (s) => {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
};

const Component = ({ name, c }) => (
  <div data-testid={`health-component-${name}`} className="bg-[#0c0c0f] px-4 py-3">
    <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">{name}</p>
    <p className="mt-1.5 flex items-center gap-2 font-mono text-[13px] text-zinc-200">
      <span className={`h-2 w-2 rounded-full ${DOT[c.status] || "bg-rose-500"}`} />
      <span data-testid={`health-component-${name}-status`}>{c.status}</span>
      {c.latencyMs != null && <span className="text-zinc-500">{c.latencyMs} ms</span>}
      {c.provider && <span className="truncate text-zinc-500">{c.provider}</span>}
    </p>
  </div>
);

export default function Health() {
  const { data, status } = useHealth();
  return (
    <Placeholder title="System status" body="Live response from the gateway health endpoint.">
      {data && (
        <div className="mt-10 max-w-xl space-y-3">
          <p data-testid="health-summary" className="font-mono text-[13px] text-zinc-400">
            <span className="text-zinc-100">{data.status}</span> · v{data.version} · uptime {fmtUptime(data.uptimeSeconds)}
          </p>
          <div className="grid gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
            {Object.entries(data.components || {}).map(([name, c]) => <Component key={name} name={name} c={c} />)}
          </div>
        </div>
      )}
      <pre data-testid="health-json" className="mt-4 max-w-xl overflow-x-auto rounded-lg border border-[var(--line)] bg-[#0c0c0f] p-5 font-mono text-[13px] text-zinc-300">
        {status === "checking" ? "Checking..." : data ? JSON.stringify(data, null, 2) : "Health endpoint unreachable."}
      </pre>
    </Placeholder>
  );
}
