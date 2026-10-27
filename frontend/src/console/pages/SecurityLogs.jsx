import { useMemo, useState } from "react";
import { RotateCw, Search } from "lucide-react";
import { usePrefs } from "@/preferences/PreferencesContext";
import { useLogs } from "../hooks/useGateway";
import { fmtInt, fmtStamp } from "../lib/format";
import { PageHeader, Panel, Segmented, Skeleton, StatusCode, Td, Th, btnSecondary, inputCls } from "../components/ui";

const FILTERS = [{ value: "all", label: "All" }, { value: "200", label: "200" }, { value: "403", label: "403" }, { value: "429", label: "429" }];

const ruleCls = (r) => (r.status === 403 ? "text-rose-300" : r.status === 429 ? "text-amber-300" : "text-zinc-400");

export default function SecurityLogs() {
  const { data, loading, reload } = useLogs();
  const { t } = usePrefs();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data || []).filter((r) => (status === "all" || String(r.status) === status) && (!q || [r.id, r.endpoint, r.rule, r.key, r.model].some((v) => v && v.toLowerCase().includes(q))));
  }, [data, status, query]);

  return (
    <div data-testid="security-logs-page">
      <PageHeader
        title={t("console.nav.logs")}
        description={t("console.logs.desc")}
        actions={<button type="button" onClick={reload} data-testid="logs-refresh-button" className={btnSecondary}><RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />{t("console.logs.refresh")}</button>}
      />
      <div className="space-y-3 px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by request ID, rule, key" data-testid="logs-search-input" className={`${inputCls} h-8 py-1 pl-8 font-mono text-xs`} />
          </div>
          <Segmented label="Status filter" testId="logs-status-filter" value={status} onChange={setStatus} options={FILTERS} />
          <span data-testid="logs-count" className="tnum font-mono text-[11px] text-zinc-500 sm:ml-auto">{fmtInt(rows.length)} events</span>
        </div>
        <Panel testId="logs-table-panel">
          {!data ? <div className="space-y-2 p-4">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-7" />)}</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]" data-testid="logs-table">
                <thead className="border-b border-[var(--line)]">
                  <tr><Th>Timestamp</Th><Th>Request ID</Th><Th>Key</Th><Th>Endpoint</Th><Th>Status</Th><Th>Rule triggered</Th><Th className="text-right">Latency</Th></tr>
                </thead>
                <tbody className="font-mono">
                  {rows.map((r) => (
                    <tr key={r.id} data-testid="log-row" className="border-b border-[var(--line)] last:border-0 hover:bg-zinc-900/50">
                      <Td className="tnum h-8 text-zinc-500">{fmtStamp(r.ts)}</Td>
                      <Td className="h-8 text-zinc-300">{r.id}</Td>
                      <Td className="h-8 text-zinc-400">{r.key}</Td>
                      <Td className="h-8 text-zinc-400">{r.endpoint}</Td>
                      <Td className="h-8"><StatusCode code={r.status} /></Td>
                      <Td className={`h-8 ${ruleCls(r)}`}>{r.rule || <span className="text-zinc-700">-</span>}</Td>
                      <Td className="tnum h-8 text-right text-zinc-300">{r.latency} ms</Td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center font-sans text-sm text-zinc-500" data-testid="logs-empty">No events match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
