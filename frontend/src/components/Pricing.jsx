import { Link } from "react-router-dom";
import { Reveal, SectionHead } from "@/components/Reveal";
import { usePrefs } from "@/preferences/PreferencesContext";
import { TIERS } from "@/content";

const Tier = ({ t, delay, featuredLabel }) => (
  <Reveal delay={delay} data-testid={`pricing-card-${t.id}`}
    className={`flex flex-col border-[var(--line)] p-7 sm:p-9 ${t.featured ? "bg-[var(--surface)] md:-my-4 md:border md:border-[var(--line-strong)] md:rounded-lg" : ""}`}>
    <div className="flex items-baseline justify-between">
      <h3 className="font-display text-lg font-semibold text-zinc-100">{t.name}</h3>
      {t.featured && <span className="font-mono text-xs text-[var(--accent-ink)]">{featuredLabel}</span>}
    </div>
    <p className="mt-1 text-sm text-zinc-400">{t.note}</p>
    <p className="mt-8 font-display text-5xl font-bold tracking-[-0.04em] text-zinc-100" data-testid={`pricing-price-${t.id}`}>{t.price}</p>
    <p className="mt-1 font-mono text-xs text-zinc-500">{t.unit}</p>
    <ul className="mt-8 flex-1 space-y-3 border-t border-[var(--line)] pt-6">
      {t.items.map((it) => (
        <li key={it} className="flex gap-3 text-sm text-zinc-300">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-[var(--accent)]" />{it}
        </li>
      ))}
    </ul>
    <Link to={t.href} data-testid={`pricing-select-button-${t.id}`}
      className={`mt-10 rounded-[5px] px-4 py-3 text-center text-sm font-semibold transition-colors duration-200 ${t.featured ? "bg-[var(--accent)] text-[#0b0b0d] hover:bg-[var(--accent-ink)]" : "border border-[var(--line-strong)] text-zinc-200 hover:border-zinc-400"}`}>
      {t.cta}
    </Link>
  </Reveal>
);

export const Pricing = () => {
  const { t } = usePrefs();
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32" data-testid="pricing-section">
      <SectionHead index="02" label={t("pricing.label")} title={t("pricing.title")} body={t("pricing.body")} />
      <div className="grid divide-y divide-[var(--line)] rounded-lg border border-[var(--line)] md:grid-cols-3 md:divide-x md:divide-y-0">
        {TIERS.map((tier, i) => (
          <Tier key={tier.id} t={{ ...tier, ...t(`pricing.tiers.${tier.id}`) }} delay={i * 0.08} featuredLabel={t("pricing.featured")} />
        ))}
      </div>
    </section>
  );
};
