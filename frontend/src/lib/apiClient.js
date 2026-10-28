const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "tollgate.token";
export const UNAUTHORIZED_EVENT = "tollgate:unauthorized";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Seconds since epoch when the stored JWT expires, or 0 if unreadable.
export const tokenExpiry = (token) => {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part)).exp || 0;
  } catch { return 0; }
};

export const formatApiError = (detail) => {
  if (detail == null) return "Something went wrong. Try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (typeof e?.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (typeof detail?.msg === "string") return detail.msg;
  return String(detail);
};

export const apiRequest = async (path, { method = "GET", body, auth = true } = {}) => {
  const headers = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    const err = new Error(formatApiError(data?.detail));
    err.status = res.status;
    throw err;
  }
  return data;
};

export const authApi = {
  signIn: (body) => apiRequest("/auth/signin", { method: "POST", body, auth: false }),
  signUp: (body) => apiRequest("/auth/signup", { method: "POST", body, auth: false }),
  me: () => apiRequest("/auth/me"),
  updateProfile: (body) => apiRequest("/auth/profile", { method: "PUT", body }),
};
