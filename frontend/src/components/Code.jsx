const TOKEN = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\$[A-Z_]+|\b(?:import|from|const|await|new)\b|\s-[Hd]\b|\b\d+\b)/g;

const colorFor = (t, next) => {
  if (/^["']/.test(t)) return next === ":" ? "text-zinc-200" : "text-[#9fd8a8]";
  if (t.startsWith("$")) return "text-[#f0b46a]";
  if (/^\d+$/.test(t)) return "text-[#f0b46a]";
  if (/-[Hd]/.test(t)) return "text-zinc-400";
  return "text-[var(--accent-ink)]";
};

const Line = ({ text }) => {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (i % 2 === 0) return <span key={i} className="text-zinc-300">{p}</span>;
        const next = (parts[i + 1] || "").trimStart()[0];
        return <span key={i} className={colorFor(p, next)}>{p}</span>;
      })}
    </>
  );
};

export const Code = ({ source, testId }) => (
  <pre data-testid={testId} className="overflow-x-auto whitespace-pre font-mono text-[12.5px] leading-[1.7]">
    {source.split("\n").map((l, i) => (
      <div key={i} className="flex">
        <span className="mr-4 w-5 shrink-0 select-none text-right text-zinc-600">{i + 1}</span>
        <span><Line text={l} /></span>
      </div>
    ))}
  </pre>
);
