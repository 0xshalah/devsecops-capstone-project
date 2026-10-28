import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { UNAUTHORIZED_EVENT, authApi, tokenExpiry, tokenStore } from "@/lib/apiClient";

const Ctx = createContext(null);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const toSession = ({ user, workspace }) => ({ ...user, orgId: user.workspaceId, workspace });

// Drop leftovers from the old browser-only mock session.
["tollgate.session", "tollgate.accounts"].forEach((k) => localStorage.removeItem(k));

export const AuthProvider = ({ children }) => {
  // undefined = checking stored token, null = signed out, object = signed in
  const [session, setSession] = useState(undefined);
  const expiryTimer = useRef(null);

  const signOut = useCallback(() => {
    clearTimeout(expiryTimer.current);
    tokenStore.clear();
    setSession(null);
  }, []);

  const scheduleExpiry = useCallback((token) => {
    clearTimeout(expiryTimer.current);
    const ms = tokenExpiry(token) * 1000 - Date.now();
    expiryTimer.current = setTimeout(signOut, Math.max(ms, 0));
  }, [signOut]);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token || tokenExpiry(token) * 1000 <= Date.now()) { signOut(); return; }
    authApi.me().then((d) => { setSession(toSession(d)); scheduleExpiry(token); }).catch(signOut);
  }, [signOut, scheduleExpiry]);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, signOut);
    return () => { window.removeEventListener(UNAUTHORIZED_EVENT, signOut); clearTimeout(expiryTimer.current); };
  }, [signOut]);

  const begin = useCallback((data) => {
    tokenStore.set(data.token);
    scheduleExpiry(data.token);
    setSession(toSession(data));
  }, [scheduleExpiry]);

  const signIn = useCallback(async ({ email, password }) => begin(await authApi.signIn({ email: email.trim(), password })), [begin]);

  const signUp = useCallback(async ({ name, email, password }) => (
    begin(await authApi.signUp({ name: name.trim(), email: email.trim(), password }))
  ), [begin]);

  const signInWithGoogle = useCallback(async () => {
    throw new Error("Google sign-in is not available yet. Use your email and password.");
  }, []);

  // Password reset email is delivered in a later phase; the UI flow stays the same.
  const requestReset = useCallback(() => wait(900), []);

  const updateProfile = useCallback(async (fields) => setSession(toSession(await authApi.updateProfile(fields))), []);

  const value = useMemo(
    () => ({ session, signIn, signUp, signInWithGoogle, requestReset, updateProfile, signOut }),
    [session, signIn, signUp, signInWithGoogle, requestReset, updateProfile, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
