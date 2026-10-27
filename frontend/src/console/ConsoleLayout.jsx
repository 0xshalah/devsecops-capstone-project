import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConsoleProvider, useConsole } from "./ConsoleContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { CommandPalette } from "./components/CommandPalette";
import { CreateKeyDialog } from "./components/CreateKeyDialog";
import { ProfileDialog } from "./components/ProfileDialog";

const useShortcuts = () => {
  const { toggleSidebar, setPaletteOpen } = useConsole();
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "k") { e.preventDefault(); setPaletteOpen((o) => !o); }
      if (k === "b") { e.preventDefault(); toggleSidebar(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebar, setPaletteOpen]);
};

const Shell = () => {
  useShortcuts();
  return (
    <div data-testid="console-root" className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main data-testid="console-main" className="console-scroll min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <CreateKeyDialog />
      <ProfileDialog />
    </div>
  );
};

export default function ConsoleLayout() {
  return (
    <ConsoleProvider>
      <TooltipProvider delayDuration={120}>
        <Shell />
      </TooltipProvider>
    </ConsoleProvider>
  );
}
