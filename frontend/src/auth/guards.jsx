import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const SIGN_IN = "/auth/sign-in";

export const RequireAuth = ({ children }) => {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to={SIGN_IN} replace state={{ from: location.pathname }} />;
  return children;
};

export const GuestOnly = ({ children }) => {
  const { session } = useAuth();
  const { state } = useLocation();
  if (session) return <Navigate to={state?.from || "/console"} replace />;
  return children;
};
