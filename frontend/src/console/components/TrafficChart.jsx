import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtCompact, fmtHour, fmtInt } from "../lib/format";
import { Panel, Segmented } from "./ui";
import { usePrefs } from "@/preferences/PreferencesContext";

const PALETTE = {
  dark: { tick: "#71717a", grid: "#1c1c20", bar: "#3a3a40", cursor: "#ffffff08", dotStroke: "#09090b" },
  light: { tick: "#64748b", grid: "#e4e4e7", bar: "#cbd5e1", cursor: "#0f172a0a", dotStroke: "#ffffff" },
};
const FLAGGED = "#f59e0b";
const BLOCKED = "#ff5500";

const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[4px] border border-[var(--line-strong)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-[11px] tnum">
      <p className="text-zinc-500">{d.label} UTC</p>
      {payload.map((p) => <p key={p.dataKey} className="text-zinc-100"><span style={{ color: p.color }}>&#9632;</span> {fmtInt(p.value)} {p.name}</p>)}
    </div>
  );
};

const Legend = ({ bar }) => (
  <div data-testid="traffic-chart-legend" className="flex gap-4 px-4 pb-3 font-mono text-[11px] text-zinc-500">
    {[["clean", bar], ["flagged", FLAGGED], ["blocked", BLOCKED]].map(([name, color]) => (
      <span key={name} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: color }} />{name}</span>
    ))}
  </div>
);

export const TrafficChart = ({ data }) => {
  const [mode, setMode] = useState("requests");
  const { theme, t } = usePrefs();
  const c = PALETTE[theme];
  const axis = { axisLine: false, tickLine: false, tick: { fill: c.tick, fontSize: 11, fontFamily: "IBM Plex Mono" } };
  const rows = data.map((d) => ({ ...d, label: fmtHour(d.t) }));
  const common = { data: rows, margin: { top: 4, right: 8, left: -8, bottom: 0 } };
  const x = <XAxis dataKey="label" {...axis} interval={3} />;
  const grid = <CartesianGrid stroke={c.grid} vertical={false} />;

  return (
    <Panel
      title={t("console.overview.traffic")}
      testId="traffic-chart-panel"
      action={<Segmented label="Chart series" testId="traffic-chart-mode" value={mode} onChange={setMode} options={[{ value: "requests", label: "Requests" }, { value: "latency", label: "Latency" }]} />}
    >
      <div className="h-[220px] px-2 pb-2 pt-4" data-testid="traffic-chart">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "requests" ? (
            <BarChart {...common} barCategoryGap={3}>
              {grid}{x}
              <YAxis {...axis} width={44} tickFormatter={fmtCompact} allowDecimals={false} />
              <Tooltip cursor={{ fill: c.cursor }} content={<ChartTip />} />
              <Bar dataKey="clean" name="clean" stackId="t" fill={c.bar} isAnimationActive={false} />
              <Bar dataKey="flagged" name="flagged" stackId="t" fill={FLAGGED} isAnimationActive={false} />
              <Bar dataKey="blocks" name="blocked" stackId="t" fill={BLOCKED} isAnimationActive={false} />
            </BarChart>
          ) : (
            <LineChart {...common}>
              {grid}{x}
              <YAxis {...axis} width={44} tickFormatter={(v) => `${v}ms`} />
              <Tooltip cursor={{ stroke: c.bar }} content={<ChartTip />} />
              <Line type="monotone" dataKey="latency" name="ms avg" stroke={BLOCKED} strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: BLOCKED, stroke: c.dotStroke }} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      {mode === "requests" ? <Legend bar={c.bar} /> : <div className="h-[29px]" />}
    </Panel>
  );
};
