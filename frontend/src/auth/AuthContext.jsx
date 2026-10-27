import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Mock session only. Nothing is sent to a server until real auth is wired in.
const SESSION_KEY = "tollgate.session";
const ACCOUNTS_KEY = "tollgate.accounts";
const Ctx = createContext(null);

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nameFromEmail = (email) => email.split("@")[0].replace(/[._-]+/g, " ");

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => read(SESSION_KEY, null));

  const start = useCallback((user) => {
    const next = { ...user, signedInAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

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

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, signIn, signUp, signInWithGoogle, requestReset, signOut }),
    [session, signIn, signUp, signInWithGoogle, requestReset, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
