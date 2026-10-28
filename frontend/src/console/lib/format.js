const pad = (n) => String(n).padStart(2, "0");

export const fmtInt = (n) => n.toLocaleString("en-US");
export const fmtCompact = (n) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
export const fmtTime = (ts) => {
  const d = new Date(ts);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};
export const fmtDate = (ts) => new Date(ts).toISOString().slice(0, 10);
export const fmtStamp = (ts) => `${fmtDate(ts)} ${fmtTime(ts)}`;
export const fmtHour = (ts) => `${pad(new Date(ts).getUTCHours())}:00`;

export const fmtAgo = (ts) => {
  if (!ts) return "Never used";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const maskKey = (k) => k.prefix || `sk-gw-${k.env}-...${k.last4}`;

export const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const MOD = IS_MAC ? "\u2318" : "Ctrl";
