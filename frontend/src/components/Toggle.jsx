import { motion } from "framer-motion";

export const Toggle = ({ label, testId, value, onChange, options }) => (
  <div role="radiogroup" aria-label={label} data-testid={testId} className="inline-flex rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-1">
    {options.map((o) => {
      const active = value === o.value;
      return (
        <button key={o.value} type="button" role="radio" aria-checked={active} data-testid={`${testId}-${o.value}`} onClick={() => onChange(o.value)}
          className={`relative rounded-[4px] px-3.5 py-1.5 font-mono text-xs transition-colors duration-200 ${active ? "text-[#0b0b0d]" : "text-zinc-400 hover:text-zinc-100"}`}>
          {active && <motion.span layoutId={`${testId}-pill`} className="absolute inset-0 rounded-[4px] bg-zinc-100" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          <span className="relative flex items-center gap-2">
            {o.label}
            {o.badge && <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${active ? "bg-[var(--accent)] text-[#0b0b0d]" : "bg-[var(--accent)]/15 text-[var(--accent-ink)]"}`}>{o.badge}</span>}
          </span>
        </button>
      );
    })}
  </div>
);
