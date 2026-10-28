import { toast } from "sonner";

export const btnPrimary = "inline-flex h-8 items-center justify-center gap-2 rounded-[5px] bg-[var(--accent)] px-3 text-[13px] font-semibold text-[#0b0b0d] transition-[background-color,transform] duration-150 hover:bg-[var(--accent-ink)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
export const btnSecondary = "inline-flex h-8 items-center justify-center gap-2 rounded-[5px] border border-[var(--line-strong)] px-3 text-[13px] font-medium text-zinc-200 transition-colors duration-150 hover:border-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-50";
export const btnGhost = "inline-flex h-7 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs text-zinc-400 transition-colors duration-150 hover:bg-zinc-800/70 hover:text-zinc-100";
export const inputCls = "w-full rounded-[5px] border border-[var(--line)] bg-[#0b0b0d] px-3 py-2 text-[13px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 hover:border-[var(--line-strong)] focus:border-[var(--accent)]";
export const labelCls = "mb-1.5 block text-xs font-medium text-zinc-400";

export const copyText = async (text, message) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast(message);
};

export const Kbd = ({ children }) => (
  <kbd className="inline-flex h-5 items-center rounded-[3px] border border-[var(--line-strong)] bg-zinc-900 px-1.5 font-mono text-[10px] text-zinc-400">{children}</kbd>
);

export const PageHeader = ({ title, description, actions }) => (
  <div className="flex flex-col gap-4 border-b border-[var(--line)] px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
    <div>
      <h1 data-testid="page-title" className="font-display text-2xl font-bold tracking-[-0.02em] text-zinc-100">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-zinc-400">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const Panel = ({ title, action, children, className = "", testId }) => (
  <section data-testid={testId} className={`min-w-0 rounded-md border border-[var(--line)] bg-[var(--surface)] ${className}`}>
    {title && (
      <header className="flex h-11 items-center justify-between gap-3 border-b border-[var(--line)] px-4">
        <h2 className="truncate text-[13px] font-semibold text-zinc-200">{title}</h2>
        {action}
      </header>
    )}
    {children}
  </section>
);

const CODES = {
  200: ["200 OK", "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"],
  403: ["403 Blocked", "border-rose-500/30 bg-rose-500/10 text-rose-400"],
  429: ["429 Limited", "border-amber-500/30 bg-amber-500/10 text-amber-400"],
};

export const StatusCode = ({ code, testId }) => {
  const [label, cls] = CODES[code] || [String(code), "border-zinc-700 text-zinc-300"];
  return <span data-testid={testId} className={`tnum inline-flex h-5 items-center whitespace-nowrap rounded-[3px] border px-1.5 font-mono text-[11px] ${cls}`}>{label}</span>;
};

export const EnvBadge = ({ env, testId = "env-badge" }) => (
  <span data-testid={testId} className={`inline-flex h-6 items-center gap-1.5 rounded-[4px] border px-2 font-mono text-[11px] uppercase tracking-wider ${env === "live" ? "border-[#ff5500]/40 bg-[#ff5500]/10 text-[#ff7a3d]" : "border-[var(--line-strong)] bg-zinc-900 text-zinc-300"}`}>
    {env === "live" ? "Live" : "Test"}
  </span>
);

export const Segmented = ({ options, value, onChange, testId, label }) => (
  <div role="radiogroup" aria-label={label} data-testid={testId} className="inline-flex flex-wrap rounded-[5px] border border-[var(--line)] bg-[#0b0b0d] p-0.5">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={value === o.value}
        data-testid={`${testId}-${o.value}`}
        onClick={() => onChange(o.value)}
        className={`rounded-[3px] px-2.5 py-1 font-mono text-xs transition-colors duration-150 ${value === o.value ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"}`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const Switch = ({ checked, onChange, testId, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    data-testid={testId}
    onClick={() => onChange(!checked)}
    className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-150 ${checked ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--line-strong)] bg-zinc-800"}`}
  >
    <span className={`absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white transition-transform duration-150 ${checked ? "translate-x-[17px]" : "translate-x-[2px]"}`} />
  </button>
);

export const Skeleton = ({ className = "" }) => <div className={`animate-pulse rounded-[3px] bg-zinc-800/60 ${className}`} />;

export const SettingRow = ({ title, hint, children }) => (
  <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-[13px] text-zinc-200">{title}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-2">{children}</div>
  </div>
);

export const Th = ({ children, className = "" }) => (
  <th className={`h-9 whitespace-nowrap px-4 text-left font-mono text-[11px] font-normal uppercase tracking-wider text-zinc-500 ${className}`}>{children}</th>
);
export const Td = ({ children, className = "", ...rest }) => (
  <td className={`h-10 whitespace-nowrap px-4 ${className}`} {...rest}>{children}</td>
);

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

export const JsonView = ({ value, testId }) => {
  const src = JSON.stringify(value, null, 2);
  const parts = [];
  let last = 0;
  src.replace(TOKEN, (m, str, colon, lit, num, offset) => {
    parts.push(src.slice(last, offset));
    const cls = str ? (colon ? "text-zinc-300" : "text-[#34d399]") : lit ? "text-[#ff7a3d]" : "text-[#fbbf24]";
    parts.push(<span key={offset} className={cls}>{str || m}</span>);
    if (colon) parts.push(colon);
    last = offset + m.length;
    return m;
  });
  parts.push(src.slice(last));
  return <pre data-testid={testId} className="tnum whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-zinc-500">{parts}</pre>;
};
