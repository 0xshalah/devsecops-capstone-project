import { Loader2 } from "lucide-react";

export const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const Spinner = () => <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />;

export const GoogleButton = ({ loading, disabled, onClick, testId }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    data-testid={testId}
    aria-busy={loading}
    className="flex h-11 w-full items-center justify-center gap-3 rounded-[5px] border border-[var(--line-strong)] bg-[#f4f4f5] text-sm font-semibold text-[#0b0b0d] transition-[background-color,transform] duration-150 hover:bg-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
  >
    {loading ? <Spinner /> : <GoogleLogo />}
    {loading ? "Connecting to Google" : "Continue with Google"}
  </button>
);

export const SubmitButton = ({ loading, disabled, children, loadingText, testId }) => (
  <button
    type="submit"
    disabled={disabled}
    data-testid={testId}
    aria-busy={loading}
    className="flex h-11 w-full items-center justify-center gap-2 rounded-[5px] bg-[var(--accent)] text-sm font-semibold text-[#0b0b0d] transition-[background-color,transform] duration-150 hover:bg-[var(--accent-ink)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
  >
    {loading && <Spinner />}
    {loading ? loadingText : children}
  </button>
);

export const Divider = ({ children }) => (
  <div className="my-6 flex items-center gap-3" role="separator" aria-label={children}>
    <span className="h-px flex-1 bg-[var(--line)]" />
    <span className="text-xs text-zinc-500">{children}</span>
    <span className="h-px flex-1 bg-[var(--line)]" />
  </div>
);

export const AuthHeading = ({ title, children }) => (
  <div className="mb-8">
    <h1 data-testid="auth-heading" className="font-display text-[1.65rem] font-bold leading-tight tracking-[-0.03em] text-zinc-100 sm:text-3xl">{title}</h1>
    {children && <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{children}</p>}
  </div>
);

export const textLink = "font-medium text-[var(--accent-ink)] underline-offset-4 transition-colors duration-150 hover:text-zinc-100 hover:underline";
