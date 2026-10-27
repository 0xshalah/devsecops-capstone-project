import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Mock session only. Nothing is sent to a server until real auth is wired in.
const SESSION_KEY = "tollgate.session";
const ACCOUNTS_KEY = "tollgate.accounts";
const DEFAULT_PLAN = "Free";
const Ctx = createContext(null);

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nameFromEmail = (email) => email.split("@")[0].replace(/[._-]+/g, " ");

// FNV-1a, enough for stable mock identifiers.
const hash = (s) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, "0");
};
const identityFor = (email) => {
  const e = email.toLowerCase();
  return { id: `usr_${hash(e)}${hash(`${e}:u`)}`, orgId: `org_${hash(`${e}:o`)}`, plan: DEFAULT_PLAN };
};
const withIdentity = (s) => (s && !s.id ? { ...identityFor(s.email), ...s } : s);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => withIdentity(read(SESSION_KEY, null)));

  const persist = useCallback((next) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const start = useCallback((user) => {
    const account = read(ACCOUNTS_KEY, {})[user.email.toLowerCase()] || {};
    const ident = { ...identityFor(user.email), ...(account.id && { id: account.id, orgId: account.orgId, plan: account.plan }) };
    persist({ ...ident, ...user, signedInAt: new Date().toISOString() });
  }, [persist]);

  const signIn = useCallback(async ({ email }) => {
    await wait(900);
    const account = read(ACCOUNTS_KEY, {})[email.toLowerCase()];
    start({ email, name: account?.name || nameFromEmail(email), provider: "email" });
  }, [start]);

  const signUp = useCallback(async ({ name, email }) => {
    await wait(1000);
    const accounts = read(ACCOUNTS_KEY, {});
    accounts[email.toLowerCase()] = { name };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    start({ email, name, provider: "email" });
  }, [start]);

  const signInWithGoogle = useCallback(async () => {
    await wait(1200);
    start({ email: "google-user@demo.local", name: "Google user", provider: "google" });
  }, [start]);

  const requestReset = useCallback(() => wait(900), []);

  const updateProfile = useCallback(async ({ name, email }) => {
    await wait(600);
    const accounts = read(ACCOUNTS_KEY, {});
    delete accounts[session.email.toLowerCase()];
    accounts[email.toLowerCase()] = { name, id: session.id, orgId: session.orgId, plan: session.plan };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    persist({ ...session, name, email });
  }, [session, persist]);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, signIn, signUp, signInWithGoogle, requestReset, updateProfile, signOut }),
    [session, signIn, signUp, signInWithGoogle, requestReset, updateProfile, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
