import { Reveal, SectionHead } from "@/components/Reveal";
import { RoutingVisual, GuardrailVisual, MeterVisual } from "@/components/CapabilityVisuals";
import { Spotlight } from "@/components/Spotlight";

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

export const Capabilities = () => (
  <section id="features" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32" data-testid="capabilities-section">
    <SectionHead index="01" label="Capabilities" title="Three controls between your code and every model." />
    <div className="grid gap-4 md:grid-cols-6">
      <Card testId="capability-card-unified-routing" index="Routing" className="md:col-span-4" title="Unified Model Routing"
        body="Route requests across OpenAI, Anthropic, and local models through one endpoint. Failed or slow providers fail over automatically.">
        <RoutingVisual />
      </Card>
      <Reveal delay={0.08} className="md:col-span-2">
        <Spotlight />
      </Reveal>
      <Card testId="capability-card-prompt-guardrails" index="Guardrails" className="md:col-span-3" delay={0.04} title="Prompt Guardrails"
        body="Block prompt injection and redact sensitive payloads before a request leaves your network.">
        <GuardrailVisual />
      </Card>
      <Card testId="capability-card-token-governance" index="Governance" className="md:col-span-3" delay={0.1} title="Token & Cost Governance"
        body="Track token usage per API key and enforce rate limits in real time.">
        <MeterVisual />
      </Card>
    </div>
  </section>
);
