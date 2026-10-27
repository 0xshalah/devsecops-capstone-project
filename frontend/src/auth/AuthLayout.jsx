import { useLocation, useOutlet, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Wordmark } from "@/components/Logo";
import { GuestOnly } from "./guards";
import { AccessPanel } from "./components/AccessPanel";

// Short crossfade so the switch between sign in, sign up and reset reads as one card changing state.
const View = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default function AuthLayout() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  return (
    <GuestOnly>
      <div data-testid="auth-page" className="grid min-h-screen bg-[var(--bg)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="flex min-h-screen flex-col px-5 sm:px-10">
          <header className="flex h-16 items-center justify-between">
            <Wordmark testId="auth-wordmark" />
            <Link to="/" data-testid="auth-back-home-link" className="text-sm text-zinc-400 transition-colors duration-150 hover:text-zinc-100">Back to site</Link>
          </header>
          <main className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-[400px] rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8" data-testid="auth-card">
              <AnimatePresence mode="wait" initial={false}>
                <View key={pathname}>{outlet}</View>
              </AnimatePresence>
            </div>
          </main>
          <footer className="flex h-14 items-center text-xs text-zinc-500">
            Demo authentication. Your session is stored in this browser only.
          </footer>
        </div>
        <AccessPanel />
      </div>
    </GuestOnly>
  );
}
