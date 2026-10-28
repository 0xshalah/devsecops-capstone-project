import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const SIGN_IN = "/auth/sign-in";

const Checking = () => (
  <div data-testid="auth-checking" className="flex min-h-screen items-center justify-center bg-[#0b0b0d]">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" aria-label="Checking session" />
  </div>
);

export const RequireAuth = ({ children }) => {
  const { session } = useAuth();
  const location = useLocation();
  if (session === undefined) return <Checking />;
  if (!session) return <Navigate to={SIGN_IN} replace state={{ from: location.pathname }} />;
  return children;
};

export const GuestOnly = ({ children }) => {
  const { session } = useAuth();
  const { state } = useLocation();
  if (session === undefined) return <Checking />;
  if (session) return <Navigate to={state?.from || "/console"} replace />;
  return children;
};
