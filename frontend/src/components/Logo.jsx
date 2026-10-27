import { Link } from "react-router-dom";

export const LogoMark = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="6" fill="#18181b" stroke="#3a3a40" />
    <rect x="7" y="8" width="3" height="17" fill="#f4f4f5" />
    <rect x="10" y="12" width="15" height="3.5" fill="#FF5500" className="origin-left transition-transform duration-500 group-hover:-rotate-12" style={{ transformBox: "fill-box" }} />
    <rect x="22" y="18" width="3" height="7" fill="#f4f4f5" />
  </svg>
);

export const Wordmark = ({ testId = "nav-wordmark" }) => (
  <Link to="/" data-testid={testId} className="group inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-tight text-zinc-100">
    <LogoMark />
    Tollgate
  </Link>
);
