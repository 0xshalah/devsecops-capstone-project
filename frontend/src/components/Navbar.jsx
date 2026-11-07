import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/Logo";
import { scrollToId } from "@/components/SmoothScroll";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { usePrefs } from "@/preferences/PreferencesContext";
import { LINKS } from "@/content";

const NAV = [
  { key: "features", id: "features", testId: "nav-features-link" },
  { key: "how", id: "how-it-works", testId: "nav-how-it-works-link" },
  { key: "pricing", id: "pricing", testId: "nav-pricing-link" },
  { key: "faq", id: "faq", testId: "nav-faq-link" },
  { key: "docs", to: LINKS.docs, testId: "nav-docs-link" },
];

const NavItem = ({ item, onDone }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = usePrefs();
  const label = t(`nav.${item.key}`);
  const cls = "relative text-sm text-zinc-400 transition-colors duration-200 hover:text-zinc-100 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[var(--accent)] after:transition-transform after:duration-300 hover:after:scale-x-100";
  if (item.to) return <Link to={item.to} data-testid={item.testId} className={cls} onClick={onDone}>{label}</Link>;
  const go = (e) => {
    e.preventDefault();
    onDone?.();
    if (pathname !== "/") { navigate("/"); setTimeout(() => scrollToId(item.id), 120); }
    else if (onDone) setTimeout(() => scrollToId(item.id), 60); // wait for the mobile menu to collapse
    else scrollToId(item.id);
  };
  return <a href={`/#${item.id}`} data-testid={item.testId} className={cls} onClick={go}>{label}</a>;
};

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { t } = usePrefs();
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-[var(--line)] bg-[#09090b]/80 backdrop-blur-md"
      data-testid="site-navbar"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((n) => <NavItem key={n.key} item={n} />)}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <Link to={LINKS.console} data-testid="nav-console-link" className="hidden text-sm text-zinc-400 transition-colors duration-200 hover:text-zinc-100 sm:inline">
            {t("nav.console")}
          </Link>
          <Link to={LINKS.consoleKeys} data-testid="get-api-key-button" className="hidden whitespace-nowrap rounded-[5px] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-[#0b0b0d] transition-colors duration-200 hover:bg-[var(--accent-ink)] min-[400px]:inline-block">
            {t("nav.getKey")}
          </Link>
          <button data-testid="mobile-menu-toggle" aria-label={t("nav.menu")} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-[5px] border border-[var(--line)] md:hidden">
            <span className={`h-px w-4 bg-zinc-200 transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-4 bg-zinc-200 transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>
      {open && (
        <nav data-testid="mobile-menu" className="flex flex-col gap-5 border-t border-[var(--line)] px-5 py-6 md:hidden">
          {NAV.map((n) => <NavItem key={n.key} item={n} onDone={() => setOpen(false)} />)}
          <Link to={LINKS.consoleKeys} onClick={() => setOpen(false)} data-testid="mobile-get-api-key-link" className="text-sm font-semibold text-[var(--accent)] min-[400px]:hidden">{t("nav.getKey")}</Link>
        </nav>
      )}
    </motion.header>
  );
};
