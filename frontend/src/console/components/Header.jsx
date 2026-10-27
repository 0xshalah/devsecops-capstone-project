import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { useConsole } from "../ConsoleContext";
import { NAV } from "../nav";
import { MOD } from "../lib/format";
import { EnvBadge, Kbd } from "./ui";

export const Header = () => {
  const { pathname } = useLocation();
  const { setPaletteOpen, env } = useConsole();
  const item = NAV.find((n) => pathname.startsWith(n.to));
  return (
    <header data-testid="console-header" className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--line)] px-4 sm:px-6">
      <div className="hidden min-w-0 items-center gap-2 font-mono text-xs sm:flex">
        <span className="text-zinc-500">console</span>
        <span className="text-zinc-700">/</span>
        <span data-testid="console-breadcrumb" className="truncate text-zinc-200">{item?.slug}</span>
      </div>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        data-testid="command-palette-trigger"
        className="flex h-8 w-full max-w-[320px] items-center gap-2 rounded-[5px] border border-[var(--line)] bg-[var(--surface)] px-2.5 text-left text-[13px] text-zinc-500 transition-colors duration-150 hover:border-[var(--line-strong)] hover:text-zinc-300 sm:ml-auto"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate">Search or run a command</span>
        <Kbd>{MOD} K</Kbd>
      </button>
      <span data-testid="sample-data-badge" title="Values come from the local mock client until the FastAPI endpoints are connected" className="hidden whitespace-nowrap font-mono text-[11px] text-zinc-500 lg:inline">
        sample data
      </span>
      <EnvBadge env={env} testId="header-env-badge" />
    </header>
  );
};
