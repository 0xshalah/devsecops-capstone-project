import { Activity, ArrowLeftRight, KeyRound } from "lucide-react";
import { Reveal, SectionHead } from "@/components/Reveal";
import { usePrefs } from "@/preferences/PreferencesContext";

const box = "mt-6 overflow-x-auto rounded-[5px] border border-[var(--line)] bg-[#0b0b0d] px-3 py-2.5 font-mono text-[11.5px] leading-[1.8]";

const KeySnippet = () => (
  <div className={box} data-testid="how-step-1-snippet">
    <p className="text-zinc-500">name: <span className="text-zinc-200">payments-service</span></p>
    <p className="text-zinc-500">scope: <span className="text-zinc-200">chat:write</span> · rpm: <span className="text-[#f0b46a]">600</span></p>
    <p className="text-[#9fd8a8]">sk-gw-live-9f3a...c21d</p>
  </div>
);

const SwapSnippet = () => (
  <div className={box} data-testid="how-step-2-snippet">
    <p className="text-zinc-500">baseURL</p>
    <p className="whitespace-nowrap text-rose-400/80">- "https://api.openai.com/v1"</p>
    <p className="whitespace-nowrap text-[#9fd8a8]">+ "https://gateway.tollgate.example/v1"</p>
  </div>
);

const LogSnippet = () => (
  <div className={box} data-testid="how-step-3-snippet">
    <p className="whitespace-nowrap"><span className="text-rose-400">403</span> <span className="text-zinc-300">prompt_injection</span> <span className="text-zinc-500">4 ms</span></p>
    <p className="whitespace-nowrap"><span className="text-[#9fd8a8]">200</span> <span className="text-zinc-300">pii redacted x2</span> <span className="text-zinc-500">112 ms</span></p>
    <p className="whitespace-nowrap"><span className="text-[#9fd8a8]">200</span> <span className="text-zinc-300">clean</span> <span className="text-zinc-500">98 ms · 412 tok</span></p>
  </div>
);

const STEPS = [
  { icon: KeyRound, Snippet: KeySnippet },
  { icon: ArrowLeftRight, Snippet: SwapSnippet },
  { icon: Activity, Snippet: LogSnippet },
];

export const HowItWorks = () => {
  const { t } = usePrefs();
  const steps = t("how.steps");
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32" data-testid="how-it-works-section">
      <SectionHead index="02" label={t("how.label")} title={t("how.title")} body={t("how.body")} />
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, Snippet }, i) => (
          <Reveal key={i} delay={i * 0.08} data-testid={`how-step-${i + 1}`} className="group flex min-w-0 flex-col rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 transition-colors duration-300 hover:border-[var(--line-strong)] sm:p-7">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[var(--line-strong)] text-[var(--accent)] transition-transform duration-300 group-hover:-translate-y-0.5">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="font-mono text-xs text-zinc-500">0{i + 1}</span>
            </div>
            <h3 className="mt-8 font-display text-xl font-semibold tracking-tight text-zinc-100">{steps[i].title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{steps[i].body}</p>
            <Snippet />
          </Reveal>
        ))}
      </ol>
    </section>
  );
};
