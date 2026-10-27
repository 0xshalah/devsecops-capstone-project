import { Link } from "react-router-dom";
import { Wordmark } from "@/components/Logo";
import { StatusBadge } from "@/components/StatusBadge";
import { usePrefs } from "@/preferences/PreferencesContext";
import { LINKS } from "@/content";

const linkCls = "text-sm text-zinc-400 transition-colors hover:text-zinc-100";

export const Footer = () => {
  const { t } = usePrefs();
  const [a, b, c] = t("footer.tagline");
  return (
    <footer className="border-t border-[var(--line)]" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8">
        <p data-testid="footer-tagline" className="max-w-4xl font-display text-4xl font-bold leading-[1] tracking-[-0.04em] text-zinc-100 sm:text-7xl">
          {a} {b} <span className="text-[var(--accent)]">{c}</span>
        </p>
        <div className="mt-16 flex flex-col gap-8 border-t border-[var(--line)] pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-6">
            <Wordmark testId="footer-wordmark" />
            <StatusBadge />
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            <Link to={LINKS.docs} data-testid="footer-api-docs-link" className={linkCls}>{t("footer.docs")}</Link>
            <a href={LINKS.github} target="_blank" rel="noopener noreferrer" data-testid="footer-github-link" className={linkCls}>GitHub</a>
            <Link to={LINKS.security} data-testid="footer-security-policy-link" className={linkCls}>{t("footer.security")}</Link>
          </nav>
        </div>
        <p className="mt-8 font-mono text-xs text-zinc-500">&copy; {new Date().getFullYear()} Tollgate. devsecops-capstone-project</p>
      </div>
    </footer>
  );
};
