import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { RESET } from "@/constants/testIds";
import { useAuth } from "../AuthContext";
import { useAuthForm } from "../useAuthForm";
import { checkEmail } from "../validate";
import { Field } from "../components/Fields";
import { AuthHeading, SubmitButton, textLink } from "../components/Controls";

const validate = (v) => ({ email: checkEmail(v.email) });
const secondaryBtn = "flex h-11 w-full items-center justify-center gap-2 rounded-[5px] border border-[var(--line-strong)] text-sm font-medium text-zinc-200 transition-colors duration-150 hover:border-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

const Confirmation = ({ email, onResend, resending, state }) => (
  <div data-testid={RESET.confirmation} aria-live="polite">
    <span className="mb-6 flex h-10 w-10 items-center justify-center rounded-[5px] border border-[var(--line-strong)] text-[var(--accent)]">
      <MailCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
    </span>
    <AuthHeading title="Check your email">
      If an account exists for that address, we have sent password reset instructions.
    </AuthHeading>
    <p className="-mt-4 mb-8 truncate font-mono text-xs text-zinc-400" data-testid={RESET.sentTo}>sent to {email}</p>
    <div className="space-y-3">
      <Link to="/auth/sign-in" state={state} data-testid={RESET.backToSignInButton} className="flex h-11 w-full items-center justify-center rounded-[5px] bg-[var(--accent)] text-sm font-semibold text-[#0b0b0d] transition-colors duration-150 hover:bg-[var(--accent-ink)]">
        Back to Sign In
      </Link>
      <button type="button" onClick={onResend} disabled={resending} data-testid={RESET.resendButton} className={secondaryBtn}>
        {resending ? "Sending again" : "Resend email"}
      </button>
    </div>
  </div>
);

export default function ForgotPassword() {
  const { requestReset } = useAuth();
  const { state } = useLocation();
  const [sentTo, setSentTo] = useState("");
  const { bind, submit, run, pending, setPending } = useAuthForm({ email: "" }, validate);

  const send = async ({ email }) => { await requestReset(email); setSentTo(email.trim()); setPending(null); };
  const resend = () => run("resend", async () => { await requestReset(sentTo); setPending(null); toast.success(`Reset email sent again to ${sentTo}`); });

  if (sentTo) return <Confirmation email={sentTo} onResend={resend} resending={pending === "resend"} state={state} />;

  return (
    <div data-testid="forgot-password-view">
      <AuthHeading title="Reset your password">
        Enter the email address associated with your account and we will send you a link to reset your password.
      </AuthHeading>
      <form noValidate onSubmit={submit(send)} className="space-y-5">
        <Field id="reset-email" label="Work email" type="email" autoComplete="email" placeholder="name@company.com" testId={RESET.emailInput} disabled={!!pending} {...bind("email")} />
        <SubmitButton testId={RESET.submitButton} loading={pending === "form"} disabled={!!pending} loadingText="Sending link">Send Reset Link</SubmitButton>
      </form>
      <p className="mt-8 text-center text-sm text-zinc-400">
        Remembered it? <Link to="/auth/sign-in" state={state} data-testid={RESET.signInLink} className={textLink}>Back to Sign In</Link>
      </p>
    </div>
  );
}
