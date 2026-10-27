import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtCompact, fmtHour, fmtInt } from "../lib/format";
import { Panel, Segmented } from "./ui";

const tick = { fill: "#71717a", fontSize: 11, fontFamily: "IBM Plex Mono" };
const axis = { axisLine: false, tickLine: false, tick };

const ChartTip = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[4px] border border-[var(--line-strong)] bg-[#18181b] px-2.5 py-1.5 font-mono text-[11px] tnum">
      <p className="text-zinc-500">{d.label} UTC</p>
      <p className="text-zinc-100">{fmtInt(payload[0].value)} {unit}</p>
    </div>
  );
};

export const TrafficChart = ({ data }) => {
  const [mode, setMode] = useState("requests");
  const rows = data.map((d) => ({ ...d, label: fmtHour(d.t) }));
  const common = { data: rows, margin: { top: 4, right: 8, left: -8, bottom: 0 } };
  const x = <XAxis dataKey="label" {...axis} interval={3} />;
  const grid = <CartesianGrid stroke="#1c1c20" vertical={false} />;

  return (
    <Panel
      title="Traffic, last 24h (UTC)"
      testId="traffic-chart-panel"
      action={<Segmented label="Chart series" testId="traffic-chart-mode" value={mode} onChange={setMode} options={[{ value: "requests", label: "Requests" }, { value: "latency", label: "Latency" }]} />}
    >
      <div className="h-[248px] px-2 pb-3 pt-4" data-testid="traffic-chart">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "requests" ? (
            <BarChart {...common} barCategoryGap={3}>
              {grid}{x}
              <YAxis {...axis} width={44} tickFormatter={fmtCompact} />
              <Tooltip cursor={{ fill: "#ffffff08" }} content={<ChartTip unit="requests" />} />
              <Bar dataKey="requests" fill="#3a3a40" activeBar={{ fill: "#ff5500" }} isAnimationActive={false} />
            </BarChart>
          ) : (
            <LineChart {...common}>
              {grid}{x}
              <YAxis {...axis} width={44} tickFormatter={(v) => `${v}ms`} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip cursor={{ stroke: "#3a3a40" }} content={<ChartTip unit="ms avg" />} />
              <Line type="monotone" dataKey="latency" stroke="#ff5500" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#ff5500", stroke: "#09090b" }} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Panel>
  );
};
