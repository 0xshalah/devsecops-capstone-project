import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "@/pages/Landing";
import Health from "@/pages/Health";
import Placeholder from "@/pages/Placeholder";
import { SmoothScroll } from "@/components/SmoothScroll";
import ConsoleLayout from "@/console/ConsoleLayout";
import Overview from "@/console/pages/Overview";
import ApiKeys from "@/console/pages/ApiKeys";
import Playground from "@/console/pages/Playground";
import SecurityLogs from "@/console/pages/SecurityLogs";
import Settings from "@/console/pages/Settings";
import { AuthProvider } from "@/auth/AuthContext";
import { RequireAuth } from "@/auth/guards";
import AuthLayout from "@/auth/AuthLayout";
import SignIn from "@/auth/pages/SignIn";
import SignUp from "@/auth/pages/SignUp";
import ForgotPassword from "@/auth/pages/ForgotPassword";
import { PreferencesProvider, ThemeSync, useEffectiveTheme } from "@/preferences/PreferencesContext";

const PAGES = [
  { path: "/docs", title: "Documentation", body: "API reference and quickstart guides are being written. [DOCS URL]" },
  { path: "/contact", title: "Talk to sales", body: "Enterprise contact form coming soon. [SALES EMAIL]" },
  { path: "/security", title: "Security policy", body: "Responsible disclosure policy and contact. [SECURITY POLICY]" },
];

const ThemedToaster = () => (
  <Toaster theme={useEffectiveTheme()} position="bottom-right" toastOptions={{ style: { background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink)", borderRadius: 6 } }} />
);

function App() {
  return (
    <PreferencesProvider>
    <AuthProvider>
    <BrowserRouter>
      <ThemeSync />
      <SmoothScroll />
      <ThemedToaster />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/health" element={<Health />} />
        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<Navigate to="sign-in" replace />} />
          <Route path="sign-in" element={<SignIn />} />
          <Route path="sign-up" element={<SignUp />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="sign-in" replace />} />
        </Route>
        <Route path="/console" element={<RequireAuth><ConsoleLayout /></RequireAuth>}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="keys" element={<ApiKeys />} />
          <Route path="playground" element={<Playground />} />
          <Route path="logs" element={<SecurityLogs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Route>
        {PAGES.map((p) => (
          <Route key={p.path} path={p.path} element={<Placeholder title={p.title} body={p.body} />} />
        ))}
        <Route path="*" element={<Placeholder title="Not found" body="This page does not exist." />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
    </PreferencesProvider>
  );
}

export default App;
