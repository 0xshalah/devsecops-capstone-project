import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/Logo";
import { scrollToId } from "@/components/SmoothScroll";
import { LINKS } from "@/content";

const NAV = [
  { label: "Features", id: "features", testId: "nav-features-link" },
  { label: "Documentation", to: LINKS.docs, testId: "nav-docs-link" },
  { label: "Pricing", id: "pricing", testId: "nav-pricing-link" },
];

const NavItem = ({ item, onDone }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const cls = "relative text-sm text-zinc-400 transition-colors duration-200 hover:text-zinc-100 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[var(--accent)] after:transition-transform after:duration-300 hover:after:scale-x-100";
  if (item.to) return <Link to={item.to} data-testid={item.testId} className={cls} onClick={onDone}>{item.label}</Link>;
  const go = (e) => {
    e.preventDefault();
    onDone?.();
    if (pathname !== "/") { navigate("/"); setTimeout(() => scrollToId(item.id), 120); } else scrollToId(item.id);
  };
  return <a href={`/#${item.id}`} data-testid={item.testId} className={cls} onClick={go}>{item.label}</a>;
};

export const Navbar = () => {
  const [open, setOpen] = useState(false);
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
          {NAV.map((n) => <NavItem key={n.label} item={n} />)}
        </nav>
        <div className="flex items-center gap-3">
          <Link to={LINKS.console} data-testid="get-api-key-button" className="rounded-[5px] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-[#0b0b0d] transition-colors duration-200 hover:bg-[var(--accent-ink)]">
            Get API Key
          </Link>
          <button data-testid="mobile-menu-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-[5px] border border-[var(--line)] md:hidden">
            <span className={`h-px w-4 bg-zinc-200 transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-4 bg-zinc-200 transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>
      {open && (
        <nav data-testid="mobile-menu" className="flex flex-col gap-5 border-t border-[var(--line)] px-5 py-6 md:hidden">
          {NAV.map((n) => <NavItem key={n.label} item={n} onDone={() => setOpen(false)} />)}
        </nav>
      )}
    </motion.header>
  );
};
