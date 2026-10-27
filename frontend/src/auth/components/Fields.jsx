import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const inputCls = (invalid) =>
  `h-11 w-full rounded-[5px] border bg-[#0b0b0d] px-3 text-sm text-zinc-100 outline-none transition-colors duration-150 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-[#ff5500]/40 ${
    invalid ? "border-red-500/70 focus:border-red-400" : "border-[var(--line)] hover:border-[var(--line-strong)] focus:border-[var(--accent)]"
  }`;

export const FieldError = ({ id, children }) =>
  children ? <p id={id} role="alert" data-testid={id} className="mt-1.5 text-xs text-red-400">{children}</p> : null;

export const Field = ({ id, label, error, aside, testId, ...props }) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between">
      <label htmlFor={id} className="text-xs font-medium text-zinc-300">{label}</label>
      {aside}
    </div>
    <input
      id={id}
      data-testid={testId}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={inputCls(error)}
      {...props}
    />
    <FieldError id={`${id}-error`}>{error}</FieldError>
  </div>
);

export const PasswordField = ({ id, label, error, aside, testId, toggleTestId, describedBy, ...props }) => {
  const [shown, setShown] = useState(false);
  const ids = [error && `${id}-error`, describedBy].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-medium text-zinc-300">{label}</label>
        {aside}
      </div>
      <div className="relative">
        <input id={id} type={shown ? "text" : "password"} data-testid={testId} aria-invalid={!!error} aria-describedby={ids} className={`${inputCls(error)} pr-11`} {...props} />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          data-testid={toggleTestId}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[5px] text-zinc-500 transition-colors duration-150 hover:text-zinc-200"
        >
          {shown ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
        </button>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
};
