import { Link, useLocation } from "react-router-dom";
import { Check } from "lucide-react";
import { REGISTER } from "@/constants/testIds";
import { useAuth } from "../AuthContext";
import { useAuthForm, useAfterAuth } from "../useAuthForm";
import { MIN_PASSWORD, checkEmail, checkName, checkPassword } from "../validate";
import { Field, PasswordField } from "../components/Fields";
import { AuthHeading, Divider, GoogleButton, SubmitButton, textLink } from "../components/Controls";

const validate = (v) => ({
  name: checkName(v.name),
  email: checkEmail(v.email),
  password: checkPassword(v.password, { min: MIN_PASSWORD }),
});

const LengthHint = ({ length }) => {
  const met = length >= MIN_PASSWORD;
  return (
    <p id="signup-password-hint" data-testid={REGISTER.passwordRequirement} data-met={met} className={`mt-2 flex items-center gap-2 text-xs transition-colors duration-150 ${met ? "text-emerald-400" : "text-zinc-400"}`}>
      <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border ${met ? "border-emerald-400 bg-emerald-400/10" : "border-[var(--line-strong)]"}`}>
        {met && <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />}
      </span>
      At least {MIN_PASSWORD} characters
      <span className="ml-auto font-mono tnum text-zinc-500">{Math.min(length, 99)}/{MIN_PASSWORD}</span>
    </p>
  );
};

export default function SignUp() {
  const { signUp, signInWithGoogle } = useAuth();
  const { state } = useLocation();
  const done = useAfterAuth();
  const { values, bind, submit, run, pending } = useAuthForm({ name: "", email: "", password: "" }, validate);

  return (
    <div data-testid="sign-up-view">
      <AuthHeading title="Create a developer account">Create keys, test prompts and review guardrail logs from one console.</AuthHeading>
      <GoogleButton testId={REGISTER.googleButton} loading={pending === "google"} disabled={!!pending} onClick={() => run("google", async () => { await signInWithGoogle(); done(); })} />
      <Divider>or continue with email</Divider>
      <form noValidate onSubmit={submit(async (v) => { await signUp(v); done(); })} className="space-y-5">
        <Field id="signup-name" label="Name or organization" autoComplete="organization" placeholder="Acme Platform Team" testId={REGISTER.nameInput} disabled={!!pending} {...bind("name")} />
        <Field id="signup-email" label="Work email" type="email" autoComplete="email" placeholder="name@company.com" testId={REGISTER.emailInput} disabled={!!pending} {...bind("email")} />
        <div>
          <PasswordField id="signup-password" label="Password" autoComplete="new-password" describedBy="signup-password-hint" testId={REGISTER.passwordInput} toggleTestId={REGISTER.passwordToggle} disabled={!!pending} {...bind("password")} />
          <LengthHint length={values.password.length} />
        </div>
        <SubmitButton testId={REGISTER.submitButton} loading={pending === "form"} disabled={!!pending} loadingText="Creating account">Create Account</SubmitButton>
      </form>
      <p className="mt-8 text-center text-sm text-zinc-400">
        Already have an account? <Link to="/auth/sign-in" state={state} data-testid={REGISTER.loginLink} className={textLink}>Sign in</Link>
      </p>
    </div>
  );
}
