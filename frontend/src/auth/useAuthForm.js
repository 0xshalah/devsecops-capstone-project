import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { hasErrors } from "./validate";

// Shared form state: values, per-field errors shown after blur or submit, and the pending action.
export const useAuthForm = (initial, validate) => {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(null);
  const errors = validate(values);
  const shown = Object.fromEntries(Object.keys(errors).map((k) => [k, submitted || touched[k] ? errors[k] : ""]));

  const bind = (name) => ({
    name,
    value: values[name],
    onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })),
    onBlur: () => setTouched((t) => ({ ...t, [name]: true })),
    error: shown[name],
  });

  const run = async (kind, fn) => {
    setPending(kind);
    try { await fn(); } catch (e) { toast.error(e?.message || "Something went wrong. Try again."); setPending(null); }
  };

  const submit = (fn) => (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors(errors)) {
      e.currentTarget.querySelector("[aria-invalid='true']")?.focus();
      return;
    }
    run("form", () => fn(values));
  };

  return { values, bind, submit, run, pending, setPending };
};

export const useAfterAuth = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  return () => navigate(state?.from || "/console", { replace: true });
};
