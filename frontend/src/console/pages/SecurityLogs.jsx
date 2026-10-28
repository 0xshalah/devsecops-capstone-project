import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw, Search } from "lucide-react";
import { usePrefs } from "@/preferences/PreferencesContext";
import { useLogs } from "../hooks/useGateway";
import { fmtInt, fmtStamp } from "../lib/format";
import { PageHeader, Panel, Segmented, Skeleton, StatusCode, Td, Th, btnGhost, btnSecondary, inputCls } from "../components/ui";

const PAGE_SIZE = 50;
const STATUS = ["all", "blocked", "flagged", "clean"].map((v) => ({ value: v, label: v }));
const SEVERITY = ["all", "low", "medium", "high", "critical"].map((v) => ({ value: v, label: v }));
const SEV_CLS = { low: "text-zinc-500", medium: "text-amber-300", high: "text-orange-400", critical: "text-rose-400" };
const ruleCls = (r) => (r.outcome === "blocked" ? "text-rose-300" : r.outcome === "flagged" ? "text-amber-300" : "text-zinc-400");

const useDebounced = (value, ms = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return v;
};

const LogRow = ({ r }) => (
  <tr data-testid="log-row" className="border-b border-[var(--line)] last:border-0 hover:bg-zinc-900/50">
    <Td className="tnum h-8 text-zinc-500">{fmtStamp(r.ts)}</Td>
    <Td className="h-8 text-zinc-300">{r.id}</Td>
    <Td className="h-8 text-zinc-400">{r.key}</Td>
    <Td className="h-8 text-zinc-400">{r.endpoint}</Td>
    <Td className="h-8"><StatusCode code={r.status} /></Td>
    <Td className={`h-8 uppercase ${SEV_CLS[r.severity]}`} data-testid="log-severity">{r.severity}</Td>
    <Td className={`h-8 ${ruleCls(r)}`}>{r.rule || <span className="text-zinc-700">-</span>}</Td>
    <Td className="h-8 max-w-[280px] truncate text-zinc-500" title={r.promptSnippet}>{r.promptSnippet}</Td>
    <Td className="tnum h-8 text-right text-zinc-300">{r.latency} ms</Td>
  </tr>
);

const Pager = ({ page, pages, onPage }) => (
  <div className="flex items-center justify-end gap-2 font-mono text-[11px] text-zinc-500">
    <button type="button" data-testid="logs-prev-page" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${btnGhost} disabled:opacity-40`}><ChevronLeft className="h-3.5 w-3.5" />Prev</button>
    <span data-testid="logs-page-indicator" className="tnum">Page {page} / {pages}</span>
    <button type="button" data-testid="logs-next-page" disabled={page >= pages} onClick={() => onPage(page + 1)} className={`${btnGhost} disabled:opacity-40`}>Next<ChevronRight className="h-3.5 w-3.5" /></button>
  </div>
);

export default function SecurityLogs() {
  const { t } = usePrefs();
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(query.trim());
  useEffect(() => { setPage(1); }, [status, severity, q]);
  const { data, loading, reload } = useLogs({ q, status, severity, page, limit: PAGE_SIZE });
  const rows = data?.items || [];

  return (
    <div data-testid="security-logs-page">
      <PageHeader
        title={t("console.nav.logs")}
        description={t("console.logs.desc")}
        actions={<button type="button" onClick={reload} data-testid="logs-refresh-button" className={btnSecondary}><RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />{t("console.logs.refresh")}</button>}
      />
      <div className="space-y-3 px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input value={query} maxLength={100} onChange={(e) => setQuery(e.target.value)} placeholder="Search ID, rule, key, prompt" data-testid="logs-search-input" className={`${inputCls} h-8 py-1 pl-8 font-mono text-xs`} />
          </div>
          <Segmented label="Status filter" testId="logs-status-filter" value={status} onChange={setStatus} options={STATUS} />
          <Segmented label="Severity filter" testId="logs-severity-filter" value={severity} onChange={setSeverity} options={SEVERITY} />
          <span data-testid="logs-count" className="tnum font-mono text-[11px] text-zinc-500 lg:ml-auto">{fmtInt(data?.total || 0)} events</span>
        </div>
        <Panel testId="logs-table-panel">
          {!data ? <div className="space-y-2 p-4">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-7" />)}</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]" data-testid="logs-table">
                <thead className="border-b border-[var(--line)]">
                  <tr><Th>Timestamp</Th><Th>Request ID</Th><Th>Key</Th><Th>Endpoint</Th><Th>Status</Th><Th>Severity</Th><Th>Rule triggered</Th><Th>Prompt</Th><Th className="text-right">Latency</Th></tr>
                </thead>
                <tbody className="font-mono">
                  {rows.map((r) => <LogRow key={r.id} r={r} />)}
                  {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center font-sans text-sm text-zinc-500" data-testid="logs-empty">No events match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
      </div>
    </div>
  );
}
