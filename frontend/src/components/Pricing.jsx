import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { Reveal, SectionHead } from "@/components/Reveal";
import { Toggle } from "@/components/Toggle";
import { usePrefs } from "@/preferences/PreferencesContext";
import { LINKS, PLANS } from "@/content";

const money = (amount, currency) =>
  currency === "usd" ? { symbol: "$", value: amount.toLocaleString("en-US") } : { symbol: "Rp", value: amount.toLocaleString("id-ID") };

const Price = ({ plan, currency, billing, t }) => {
  const p = plan.price ? money(plan.price[currency][billing], currency) : null;
  const key = p ? `${currency}-${billing}-${p.value}` : "contact";
  return (
    <div className="mt-8 flex h-14 items-end" data-testid={`pricing-price-${plan.id}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-baseline gap-1.5 font-display font-bold tracking-[-0.04em] text-zinc-100">
          {p ? (
            <>
              <span className={currency === "usd" ? "text-5xl" : "text-lg tracking-normal text-zinc-400"}>{p.symbol}</span>
              {currency === "usd" ? <span className="-ml-1.5 text-5xl">{p.value}</span> : <span className="text-[2.1rem] leading-none">{p.value}</span>}
            </>
          ) : <span className="text-4xl">{t("pricing.contact")}</span>}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

const BillingNote = ({ plan, currency, billing, t }) => {
  let text = t("pricing.contract");
  if (plan.price && plan.price[currency].monthly === 0) text = t("pricing.freeForever");
  else if (plan.price && billing === "annual") {
    const yearly = money(plan.price[currency].annual * 12, currency);
    text = t("pricing.billedAnnually", { total: `${yearly.symbol}${currency === "usd" ? "" : " "}${yearly.value}` });
  } else if (plan.price) text = t("pricing.billedMonthly");
  return (
    <div className="mt-1 min-h-[2.25rem] font-mono text-xs leading-[1.5] text-zinc-500" data-testid={`pricing-billing-note-${plan.id}`}>
      {plan.price && <span className="text-zinc-400">{t("pricing.perMonth")} </span>}{text}
    </div>
  );
};

const PlanCard = ({ plan, currency, billing, delay }) => {
  const { t, lang } = usePrefs();
  const copy = t(`pricing.plans.${plan.id}`);
  const quota = plan.quota ? t("pricing.requests", { n: plan.quota.toLocaleString(lang === "id" ? "id-ID" : "en-US") }) : t("pricing.customQuota");
  const href = plan.price ? `${LINKS.signup}?plan=${plan.id}&billing=${billing}&currency=${currency}` : LINKS.contact;
  return (
    <Reveal delay={delay} data-testid={`pricing-card-${plan.id}`}
      className={`relative flex flex-col rounded-lg border p-7 transition-colors duration-300 ${plan.featured ? "border-[var(--accent)] bg-[var(--surface)] shadow-[0_30px_80px_-40px_rgba(255,85,0,0.45)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-zinc-100">{copy.name}</h3>
        {plan.featured && <span data-testid="pricing-featured-badge" className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#0b0b0d]">{t("pricing.featured")}</span>}
      </div>
      <p className="mt-1.5 min-h-[2.5rem] text-sm text-zinc-400">{copy.note}</p>
      <Price plan={plan} currency={currency} billing={billing} t={t} />
      <BillingNote plan={plan} currency={currency} billing={billing} t={t} />
      <p data-testid={`pricing-quota-${plan.id}`} className="mt-6 rounded-[5px] border border-[var(--line)] bg-[#0b0b0d] px-3 py-2 font-mono text-xs text-zinc-200">{quota}</p>
      <ul className="mt-6 flex-1 space-y-3">
        {copy.items.map((it) => (
          <li key={it} className="flex gap-2.5 text-sm text-zinc-300">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? "text-[var(--accent)]" : "text-zinc-500"}`} />{it}
          </li>
        ))}
      </ul>
      <Link to={href} data-testid={`pricing-select-button-${plan.id}`}
        className={`mt-8 rounded-[5px] px-4 py-3 text-center text-sm font-semibold transition-[background-color,border-color,transform] duration-200 active:scale-[0.98] ${plan.featured ? "bg-[var(--accent)] text-[#0b0b0d] hover:bg-[var(--accent-ink)]" : "border border-[var(--line-strong)] text-zinc-200 hover:border-zinc-400"}`}>
        {copy.cta}
      </Link>
    </Reveal>
  );
};

export const Pricing = () => {
  const { t } = usePrefs();
  const [billing, setBilling] = useState("monthly");
  const [currency, setCurrency] = useState("usd");
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32" data-testid="pricing-section">
      <SectionHead index="03" label={t("pricing.label")} title={t("pricing.title")} body={t("pricing.body")} />
      <Reveal className="mb-8 flex flex-wrap items-center gap-3">
        <Toggle label={t("pricing.billingLabel")} testId="pricing-billing-toggle" value={billing} onChange={setBilling}
          options={[{ value: "monthly", label: t("pricing.monthly") }, { value: "annual", label: t("pricing.annual"), badge: t("pricing.save") }]} />
        <Toggle label={t("pricing.currencyLabel")} testId="pricing-currency-toggle" value={currency} onChange={setCurrency}
          options={[{ value: "usd", label: "USD" }, { value: "idr", label: "IDR" }]} />
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan, i) => <PlanCard key={plan.id} plan={plan} currency={currency} billing={billing} delay={i * 0.06} />)}
      </div>
      <p data-testid="pricing-footnote" className="mt-8 max-w-3xl text-xs leading-relaxed text-zinc-500">{t("pricing.footnote")}</p>
    </section>
  );
};
