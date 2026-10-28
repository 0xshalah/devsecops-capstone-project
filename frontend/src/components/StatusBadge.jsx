import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LINKS } from "@/content";

const API = process.env.REACT_APP_BACKEND_URL;

const STATES = {
  checking: { text: "Checking status", dot: "bg-zinc-500" },
  operational: { text: "All Systems Operational", dot: "bg-emerald-400" },
  degraded: { text: "Degraded performance", dot: "bg-amber-400" },
  down: { text: "Status unavailable", dot: "bg-red-500" },
};

export const useHealth = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("checking");
  useEffect(() => {
    if (!API) { setStatus("down"); return undefined; }
    const ctrl = new AbortController();
    fetch(`${API}/api/health`, { signal: ctrl.signal })
      .then(async (r) => { const d = await r.json().catch(() => null); if (!d) throw new Error(String(r.status)); return d; })
      .then((d) => { setData(d); setStatus(d?.status === "operational" ? "operational" : "degraded"); })
      .catch((e) => { if (e?.name !== "AbortError") setStatus("down"); });
    return () => ctrl.abort();
  }, []);
  return { data, status };
};

export const StatusBadge = () => {
  const { status } = useHealth();
  const s = STATES[status];
  return (
    <Link to={LINKS.health} data-testid="system-status-badge" className="inline-flex items-center gap-2.5 rounded-[5px] border border-[var(--line)] px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-[var(--line-strong)] hover:text-zinc-100">
      <span className="relative flex h-2 w-2">
        {status === "operational" && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />}
        <span className={`relative h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      <span data-testid="system-status-text">{s.text}</span>
    </Link>
  );
};
