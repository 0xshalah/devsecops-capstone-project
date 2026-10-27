import { Link } from "react-router-dom";
import { Copy } from "lucide-react";
import { useHealth } from "@/components/StatusBadge";
import { useConsole } from "../ConsoleContext";
import { useOverview } from "../hooks/useGateway";
import { GATEWAY_BASE_URL } from "../nav";
import { fmtCompact, fmtInt, fmtTime } from "../lib/format";
import { EnvBadge, PageHeader, Panel, Skeleton, StatusCode, Td, Th, btnGhost, copyText } from "../components/ui";
import { TrafficChart } from "../components/TrafficChart";

const HEALTH = {
  checking: ["Checking", "bg-zinc-500"],
  operational: ["Operational", "bg-emerald-400"],
  degraded: ["Degraded", "bg-amber-400"],
  down: ["Unreachable", "bg-rose-500"],
};

const Cell = ({ label, children }) => (
  <div className="min-w-0 bg-[var(--surface)] px-4 py-3">
    <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
    <div className="flex min-h-6 items-center">{children}</div>
  </div>
);

const StatusStrip = () => {
  const { status, data } = useHealth();
  const { env } = useConsole();
  const [text, dot] = HEALTH[status];
  return (
    <div data-testid="overview-status-bar" className="grid gap-px overflow-hidden rounded-md border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
      <Cell label="Gateway health">
        <Link to="/health" data-testid="overview-health-link" className="inline-flex items-center gap-2 text-sm text-zinc-100 underline-offset-4 hover:underline">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span data-testid="overview-health-status">{text}</span>
        </Link>
      </Cell>
      <Cell label="Environment"><EnvBadge env={env} testId="overview-env-badge" /></Cell>
      <Cell label="Base URL">
        <code className="truncate font-mono text-[13px] text-zinc-300">{GATEWAY_BASE_URL}</code>
        <button type="button" aria-label="Copy base URL" data-testid="overview-copy-base-url" onClick={() => copyText(GATEWAY_BASE_URL, "Gateway base URL copied")} className={`${btnGhost} ml-1 shrink-0`}><Copy className="h-3.5 w-3.5" /></button>
      </Cell>
      <Cell label="Last health check">
        <span data-testid="overview-health-checked-at" className="tnum font-mono text-[13px] text-zinc-300">{data?.timestamp ? `${fmtTime(data.timestamp)} UTC` : "-"}</span>
      </Cell>
    </div>
  );
};

const Metric = ({ label, value, sub, testId, tone = "text-zinc-100" }) => (
  <div className="bg-[var(--surface)] p-5" data-testid={testId}>
    <p className="text-xs text-zinc-400">{label}</p>
    <p data-testid={`${testId}-value`} className={`tnum mt-3 font-mono text-[28px] font-medium leading-none tracking-tight ${tone}`}>{value}</p>
    <p className="mt-2 font-mono text-[11px] text-zinc-500">{sub}</p>
  </div>
);

const Metrics = ({ m }) => (
  <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
    <Metric testId="metric-total-requests" label="Total requests (24h)" value={fmtInt(m.totalRequests)} sub="all endpoints" />
    <Metric testId="metric-token-volume" label="Token volume" value={fmtCompact(m.tokenVolume)} sub={`${fmtInt(m.tokenVolume)} tokens`} />
    <Metric testId="metric-avg-latency" label="Avg gateway latency" value={`${m.avgLatency} ms`} sub="request weighted" />
    <Metric testId="metric-guardrail-blocks" label="Guardrail blocks" value={fmtInt(m.guardrailBlocks)} sub="403 Forbidden" tone="text-rose-400" />
  </div>
);

const RecentTable = ({ rows }) => (
  <Panel title="Recent requests" testId="recent-requests-panel" action={<Link to="/console/logs" data-testid="recent-requests-view-all" className={btnGhost}>View logs</Link>}>
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]" data-testid="recent-requests-table">
        <thead className="border-b border-[var(--line)]"><tr><Th>Time (UTC)</Th><Th>Request ID</Th><Th>Model</Th><Th>Status</Th><Th className="text-right">Latency</Th><Th className="text-right">Tokens</Th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[var(--line)] last:border-0 hover:bg-zinc-900/50" data-testid="recent-request-row">
              <Td className="tnum font-mono text-zinc-400">{fmtTime(r.ts)}</Td>
              <Td className="font-mono text-zinc-300">{r.id}</Td>
              <Td className="font-mono text-zinc-400">{r.model}</Td>
              <Td><StatusCode code={r.status} /></Td>
              <Td className="tnum text-right font-mono text-zinc-300">{r.latency} ms</Td>
              <Td className="tnum text-right font-mono text-zinc-300">{fmtInt(r.tokens)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Panel>
);

const TopRules = ({ rules }) => {
  const max = Math.max(...rules.map((r) => r.count), 1);
  return (
    <Panel title="Blocks by rule (sample)" testId="top-rules-panel">
      <ul className="space-y-4 p-4">
        {rules.map((r) => (
          <li key={r.rule} data-testid="top-rule-row">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate text-zinc-300">{r.rule}</span>
              <span className="tnum font-mono text-zinc-400">{r.count}</span>
            </div>
            <div className="mt-1.5 h-1 bg-zinc-900"><div className="h-1 bg-zinc-500" style={{ width: `${(r.count / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </Panel>
  );
};

export default function Overview() {
  const { data } = useOverview();
  return (
    <div data-testid="overview-page">
      <PageHeader title="Overview" description="Gateway telemetry for the last 24 hours." />
      <div className="space-y-5 px-4 py-6 sm:px-8">
        <StatusStrip />
        {data ? <Metrics m={data.metrics} /> : <Skeleton className="h-[118px]" />}
        <div className="grid gap-5 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-8">{data ? <TrafficChart data={data.traffic} /> : <Skeleton className="h-[293px]" />}</div>
          <div className="min-w-0 xl:col-span-4">{data ? <TopRules rules={data.topRules} /> : <Skeleton className="h-[293px]" />}</div>
        </div>
        {data ? <RecentTable rows={data.recent} /> : <Skeleton className="h-[360px]" />}
      </div>
    </div>
  );
}
