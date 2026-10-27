import { Link, useLocation } from "react-router-dom";
import { LOGIN } from "@/constants/testIds";
import { useAuth } from "../AuthContext";
import { useAuthForm, useAfterAuth } from "../useAuthForm";
import { checkEmail, checkPassword } from "../validate";
import { Field, PasswordField } from "../components/Fields";
import { AuthHeading, Divider, GoogleButton, SubmitButton, textLink } from "../components/Controls";

const validate = (v) => ({ email: checkEmail(v.email), password: checkPassword(v.password) });

export default function SignIn() {
  const { signIn, signInWithGoogle } = useAuth();
  const { state } = useLocation();
  const done = useAfterAuth();
  const { bind, submit, run, pending } = useAuthForm({ email: "", password: "" }, validate);

  return (
    <div data-testid="sign-in-view">
      <AuthHeading title="Sign in to your account">Use the work email linked to your Tollgate keys.</AuthHeading>
      <GoogleButton testId={LOGIN.googleButton} loading={pending === "google"} disabled={!!pending} onClick={() => run("google", async () => { await signInWithGoogle(); done(); })} />
      <Divider>or continue with email</Divider>
      <form noValidate onSubmit={submit(async (v) => { await signIn(v); done(); })} className="space-y-5">
        <Field id="signin-email" label="Work email" type="email" autoComplete="email" placeholder="name@company.com" testId={LOGIN.emailInput} disabled={!!pending} {...bind("email")} />
        <PasswordField
          id="signin-password"
          label="Password"
          autoComplete="current-password"
          testId={LOGIN.passwordInput}
          toggleTestId={LOGIN.passwordToggle}
          disabled={!!pending}
          aside={<Link to="/auth/forgot-password" state={state} data-testid={LOGIN.forgotPasswordLink} className={`text-xs ${textLink}`}>Forgot password?</Link>}
          {...bind("password")}
        />
        <SubmitButton testId={LOGIN.submitButton} loading={pending === "form"} disabled={!!pending} loadingText="Signing in">Sign In</SubmitButton>
      </form>
      <p className="mt-8 text-center text-sm text-zinc-400">
        Don't have an account? <Link to="/auth/sign-up" state={state} data-testid={LOGIN.registerLink} className={textLink}>Sign up</Link>
      </p>
    </div>
  );
}
