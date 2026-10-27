const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 8;

export const checkEmail = (v) => {
  if (!v.trim()) return "Enter your work email.";
  if (!EMAIL_RE.test(v.trim())) return "Enter a valid email address, for example name@company.com.";
  return "";
};

export const checkPassword = (v, { min = 1 } = {}) => {
  if (!v) return "Enter your password.";
  if (v.length < min) return `Password must be at least ${min} characters.`;
  return "";
};

export const checkName = (v) => (v.trim() ? "" : "Enter your name or organization name.");

export const hasErrors = (errors) => Object.values(errors).some(Boolean);
