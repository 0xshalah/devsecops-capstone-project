import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal, SectionHead } from "@/components/Reveal";
import { usePrefs } from "@/preferences/PreferencesContext";

export const Faq = () => {
  const { t } = usePrefs();
  const items = t("faq.items");
  return (
    <section id="faq" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32" data-testid="faq-section">
      <SectionHead index="04" label={t("faq.label")} title={t("faq.title")} />
      <Reveal className="grid gap-6 md:grid-cols-12">
        <Accordion type="single" collapsible className="border-t border-[var(--line)] md:col-span-9 md:col-start-4" data-testid="faq-accordion">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`q${i}`} className="border-[var(--line)]" data-testid={`faq-item-${i + 1}`}>
              <AccordionTrigger data-testid={`faq-question-${i + 1}`} className="gap-6 py-6 font-display text-base font-semibold text-zinc-100 hover:text-[var(--accent-ink)] hover:no-underline sm:text-lg [&>svg]:text-zinc-500">
                {it.q}
              </AccordionTrigger>
              <AccordionContent data-testid={`faq-answer-${i + 1}`} className="max-w-2xl pb-6 text-sm leading-relaxed text-zinc-400 sm:text-base">
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
};
