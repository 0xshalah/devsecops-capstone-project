import { Reveal, SectionHead } from "@/components/Reveal";
import { RoutingVisual, GuardrailVisual, MeterVisual } from "@/components/CapabilityVisuals";
import { Spotlight } from "@/components/Spotlight";
import { usePrefs } from "@/preferences/PreferencesContext";

const Card = ({ testId, index, title, body, children, className = "", delay = 0 }) => (
  <Reveal delay={delay} data-testid={testId} className={`group flex flex-col justify-between rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 transition-colors duration-300 hover:border-[var(--line-strong)] sm:p-8 ${className}`}>
    <div className="mb-8">{children}</div>
    <div>
      <p className="mb-3 font-mono text-xs text-zinc-500">{index}</p>
      <h3 className="font-display text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">{body}</p>
    </div>
  </Reveal>
);

export const Capabilities = () => {
  const { t } = usePrefs();
  const copy = (k) => ({ index: t(`cap.${k}.index`), title: t(`cap.${k}.title`), body: t(`cap.${k}.body`) });
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32" data-testid="capabilities-section">
      <SectionHead index="01" label={t("cap.label")} title={t("cap.title")} />
      <div className="grid gap-4 md:grid-cols-6">
        <Card testId="capability-card-unified-routing" className="md:col-span-4" {...copy("routing")}>
          <RoutingVisual />
        </Card>
        <Reveal delay={0.08} className="md:col-span-2">
          <Spotlight caption={t("cap.photo")} />
        </Reveal>
        <Card testId="capability-card-prompt-guardrails" className="md:col-span-3" delay={0.04} {...copy("guard")}>
          <GuardrailVisual />
        </Card>
        <Card testId="capability-card-token-governance" className="md:col-span-3" delay={0.1} {...copy("gov")}>
          <MeterVisual />
        </Card>
      </div>
    </section>
  );
};
