import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Terminal } from "@/components/Terminal";
import { LINKS } from "@/content";
import { usePrefs } from "@/preferences/PreferencesContext";

const ease = [0.22, 1, 0.36, 1];

const MaskedHeadline = ({ lines }) => (
  <h1 data-testid="hero-headline" className="font-display text-[2.15rem] font-bold leading-[0.98] tracking-[-0.035em] text-zinc-100 sm:text-6xl lg:text-[3.6rem] xl:text-[4.6rem]">
    {lines.map((line, i) => (
      <span key={line} className="line-mask">
        <motion.span
          className={`block ${i === 2 ? "text-[var(--accent)]" : ""}`}
          initial={{ y: "105%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 1, delay: 0.15 + i * 0.12, ease }}
        >
          {line}
        </motion.span>
      </span>
    ))}
  </h1>
);

const Fade = ({ delay, children, className }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay, ease }}>
    {children}
  </motion.div>
);

export const Hero = () => {
  const { scrollY } = useScroll();
  const termY = useTransform(scrollY, [0, 600], [0, -60]);
  const headY = useTransform(scrollY, [0, 600], [0, 40]);
  const { t } = usePrefs();

  return (
    <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pb-28" data-testid="hero-section">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <motion.div style={{ y: headY }} className="lg:col-span-7 lg:pt-6">
          <Fade delay={0.05}>
            <p className="mb-7 font-mono text-xs text-zinc-400">
              <span className="text-[var(--accent)]">POST</span> /v1/chat/completions
            </p>
          </Fade>
          <MaskedHeadline lines={t("hero.lines")} />
          <Fade delay={0.6}>
            <p data-testid="hero-subhead" className="mt-8 max-w-md text-base leading-relaxed text-zinc-400 md:text-lg">
              {t("hero.sub")}
            </p>
          </Fade>
          <Fade delay={0.72} className="mt-10 flex flex-wrap items-center gap-3">
            <Link to={LINKS.console} data-testid="hero-start-building-button" className="rounded-[5px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#0b0b0d] transition-[background-color,transform] duration-200 hover:bg-[var(--accent-ink)] active:scale-[0.98]">
              {t("hero.start")}
            </Link>
            <Link to={LINKS.docs} data-testid="hero-read-docs-button" className="rounded-[5px] border border-[var(--line-strong)] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors duration-200 hover:border-zinc-400 hover:text-white">
              {t("hero.docs")}
            </Link>
          </Fade>
        </motion.div>
        <motion.div style={{ y: termY }} className="min-w-0 lg:col-span-5">
          <Fade delay={0.45}>
            <Terminal />
          </Fade>
        </motion.div>
      </div>
    </section>
  );
};
