import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { usePrefs } from "@/preferences/PreferencesContext";
import { LINKS } from "@/content";

export const ClosingCta = () => {
  const { t } = usePrefs();
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32" data-testid="closing-cta-section">
      <Reveal className="relative overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] px-6 py-14 sm:px-12 sm:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--accent)] opacity-[0.12] blur-3xl" />
        <h2 data-testid="closing-cta-title" className="relative max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-[-0.03em] text-zinc-100 sm:text-5xl">{t("cta.title")}</h2>
        <p className="relative mt-5 max-w-xl text-base text-zinc-400 md:text-lg">{t("cta.body")}</p>
        <div className="relative mt-10 flex flex-wrap gap-3">
          <Link to={`${LINKS.signup}?plan=free`} data-testid="closing-cta-signup-button" className="group inline-flex items-center gap-2 rounded-[5px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#0b0b0d] transition-[background-color,transform] duration-200 hover:bg-[var(--accent-ink)] active:scale-[0.98]">
            {t("cta.primary")}<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link to={LINKS.contact} data-testid="closing-cta-sales-button" className="rounded-[5px] border border-[var(--line-strong)] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors duration-200 hover:border-zinc-400 hover:text-white">
            {t("cta.secondary")}
          </Link>
        </div>
      </Reveal>
    </section>
  );
};
