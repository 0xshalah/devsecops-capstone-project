import { Link, NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LogoMark } from "@/components/Logo";
import { usePrefs } from "@/preferences/PreferencesContext";
import { useConsole } from "../ConsoleContext";
import { NAV } from "../nav";
import { MOD } from "../lib/format";
import { Kbd } from "./ui";

const tipCls = "rounded-[4px] border border-[var(--line-strong)] bg-[#18181b] px-2 py-1 text-xs text-zinc-200";

const Label = ({ collapsed, children }) => (
  <span className={`whitespace-nowrap transition-opacity duration-150 ${collapsed ? "pointer-events-none opacity-0" : "opacity-100"}`}>{children}</span>
);

const WithTip = ({ collapsed, label, children }) => (
  <Tooltip open={collapsed ? undefined : false}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="right" sideOffset={10} className={tipCls}>{label}</TooltipContent>
  </Tooltip>
);

const NavItem = ({ item, collapsed }) => {
  const Icon = item.icon;
  const { t } = usePrefs();
  const label = t(`console.nav.${item.id}`);
  return (
    <WithTip collapsed={collapsed} label={label}>
      <NavLink
        to={item.to}
        data-testid={`sidebar-nav-${item.id}`}
        aria-label={label}
        className={({ isActive }) => `relative flex h-9 items-center gap-3 overflow-hidden rounded-[5px] pl-3 text-[13px] transition-colors duration-150 ${isActive ? "bg-zinc-900 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"}`}
      >
        {({ isActive }) => (
          <>
            {isActive && <span className="absolute bottom-2 left-0 top-2 w-px bg-[var(--accent)]" />}
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <Label collapsed={collapsed}>{label}</Label>
          </>
        )}
      </NavLink>
    </WithTip>
  );
};

export const Sidebar = () => {
  const { collapsed, toggleSidebar } = useConsole();
  const { t } = usePrefs();
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <aside
      data-testid="console-sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      className={`flex shrink-0 flex-col overflow-hidden border-r border-[var(--line)] bg-[#0b0b0d] transition-[width] duration-200 ease-out ${collapsed ? "w-14" : "w-[232px]"}`}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-[var(--line)] px-[17px]">
        <Link to="/" data-testid="sidebar-home-link" aria-label="Tollgate home" className="group flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-zinc-100">
          <LogoMark size={22} />
          <Label collapsed={collapsed}>Tollgate <span className="ml-1 font-mono text-[11px] font-normal text-zinc-500">console</span></Label>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-2" aria-label="Console">
        {NAV.map((item) => <NavItem key={item.id} item={item} collapsed={collapsed} />)}
      </nav>
      <div className="space-y-0.5 border-t border-[var(--line)] p-2">
        <WithTip collapsed={collapsed} label={`${t("console.expand")} (${MOD} B)`}>
          <button
            type="button"
            onClick={toggleSidebar}
            data-testid="sidebar-collapse-toggle"
            aria-expanded={!collapsed}
            aria-label={collapsed ? t("console.expand") : t("console.collapseSidebar")}
            className="flex h-9 w-full items-center gap-3 overflow-hidden rounded-[5px] pl-3 pr-2 text-[13px] text-zinc-400 transition-colors duration-150 hover:bg-zinc-900/60 hover:text-zinc-200"
          >
            <ToggleIcon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <Label collapsed={collapsed}>{t("console.collapse")}</Label>
            <span className={`ml-auto transition-opacity duration-150 ${collapsed ? "opacity-0" : "opacity-100"}`}><Kbd>{MOD} B</Kbd></span>
          </button>
        </WithTip>
      </div>
    </aside>
  );
};
