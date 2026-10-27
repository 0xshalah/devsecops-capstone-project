import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/auth/AuthContext";
import { usePrefs } from "@/preferences/PreferencesContext";
import { SIGN_IN } from "@/auth/guards";
import { ACCOUNT } from "@/constants/testIds";
import { useConsole } from "../ConsoleContext";

const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

export const Avatar = ({ name, size = "h-7 w-7 text-[11px]" }) => (
  <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-[4px] border border-[var(--line-strong)] bg-zinc-900 font-mono font-medium text-zinc-200 ${size}`}>
    {initials(name)}
  </span>
);

export const PlanBadge = ({ plan, testId }) => (
  <span data-testid={testId} className="inline-flex h-5 items-center rounded-[3px] border border-[var(--line-strong)] bg-zinc-900 px-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-300">
    {plan}
  </span>
);

const itemCls = "h-8 cursor-pointer gap-2.5 rounded-[4px] px-2 text-[13px] text-zinc-300 focus:bg-zinc-800/70 focus:text-zinc-100";

export const AccountMenu = () => {
  const { session, signOut } = useAuth();
  const { setProfileOpen } = useConsole();
  const navigate = useNavigate();
  const { t } = usePrefs();
  const out = () => { signOut(); navigate(SIGN_IN, { replace: true }); toast(t("console.account.signedOut")); };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        data-testid={ACCOUNT.trigger}
        aria-label="Open account menu"
        className="group flex h-8 shrink-0 items-center gap-2 rounded-[5px] border border-transparent pl-0.5 pr-1.5 outline-none transition-colors duration-150 hover:border-[var(--line)] hover:bg-[var(--surface)] focus-visible:border-[var(--accent)] data-[state=open]:border-[var(--line-strong)] data-[state=open]:bg-[var(--surface)]"
      >
        <Avatar name={session?.name} />
        <span data-testid={ACCOUNT.triggerName} className="hidden max-w-[140px] truncate text-[13px] capitalize text-zinc-300 md:inline">{session?.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-500 transition-transform duration-150 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        data-testid={ACCOUNT.menu}
        className="w-64 rounded-md border-[var(--line-strong)] bg-[#0e0e11] p-1 text-zinc-200 shadow-none"
      >
        <div className="flex items-start gap-2.5 px-2 pb-2.5 pt-2">
          <Avatar name={session?.name} size="h-8 w-8 text-xs" />
          <div className="min-w-0 flex-1">
            <p data-testid={ACCOUNT.name} className="truncate text-[13px] font-medium capitalize text-zinc-100">{session?.name}</p>
            <p data-testid={ACCOUNT.email} className="truncate font-mono text-[11px] text-zinc-500">{session?.email}</p>
            <div className="mt-2"><PlanBadge plan={session?.plan} testId={ACCOUNT.planBadge} /></div>
          </div>
        </div>
        <DropdownMenuSeparator className="-mx-1 my-1 bg-[var(--line)]" />
        <DropdownMenuItem data-testid={ACCOUNT.profileItem} onSelect={() => setProfileOpen(true)} className={itemCls}>
          <UserRound className="h-4 w-4 text-zinc-500" strokeWidth={1.75} /> {t("console.account.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem data-testid={ACCOUNT.settingsItem} onSelect={() => navigate("/console/settings")} className={itemCls}>
          <Settings className="h-4 w-4 text-zinc-500" strokeWidth={1.75} /> {t("console.account.settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="-mx-1 my-1 bg-[var(--line)]" />
        <DropdownMenuItem data-testid={ACCOUNT.signOutItem} onSelect={out} className={`${itemCls} text-rose-400 focus:bg-rose-500/10 focus:text-rose-300`}>
          <LogOut className="h-4 w-4" strokeWidth={1.75} /> {t("console.account.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
