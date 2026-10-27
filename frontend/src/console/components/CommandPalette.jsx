import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { Search, Plus, Link2, PanelLeft, CornerDownLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useConsole } from "../ConsoleContext";
import { NAV, GATEWAY_BASE_URL } from "../nav";
import { MOD } from "../lib/format";
import { Kbd, copyText } from "./ui";

const groupCls = "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-zinc-500";

const Item = ({ icon: Icon, children, hint, testId, ...props }) => (
  <Command.Item
    data-testid={testId}
    className="flex h-9 cursor-pointer select-none items-center gap-3 rounded-[4px] px-2 text-[13px] text-zinc-300 transition-colors duration-100 data-[selected=true]:bg-zinc-800/80 data-[selected=true]:text-zinc-100"
    {...props}
  >
    <Icon className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
    <span className="flex-1 truncate">{children}</span>
    {hint && <span className="font-mono text-[11px] text-zinc-600">{hint}</span>}
  </Command.Item>
);

export const CommandPalette = () => {
  const { paletteOpen, setPaletteOpen, toggleSidebar, setCreateOpen, collapsed } = useConsole();
  const navigate = useNavigate();
  const run = (fn) => { setPaletteOpen(false); fn(); };

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent data-testid="command-palette" className="top-[14%] max-w-[560px] translate-y-0 gap-0 overflow-hidden border-[var(--line-strong)] bg-[#0e0e11] p-0 sm:rounded-md [&>button]:hidden">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">Search pages and run console actions</DialogDescription>
        <Command loop label="Command palette">
          <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <Command.Input autoFocus data-testid="command-palette-input" placeholder="Type a page or action" className="h-12 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600" />
            <Kbd>Esc</Kbd>
          </div>
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty data-testid="command-palette-empty" className="px-3 py-10 text-center text-sm text-zinc-500">No matching pages or actions.</Command.Empty>
            <Command.Group heading="Jump to" className={groupCls}>
              {NAV.map((n) => (
                <Item key={n.id} value={`Go to ${n.label}`} keywords={n.keywords} icon={n.icon} hint={n.slug} testId={`command-item-nav-${n.id}`} onSelect={() => run(() => navigate(n.to))}>
                  {n.label}
                </Item>
              ))}
            </Command.Group>
            <Command.Group heading="Actions" className={groupCls}>
              <Item value="Generate New API Key" keywords={["create", "secret", "token"]} icon={Plus} testId="command-item-generate-key" onSelect={() => run(() => { navigate("/console/keys"); setCreateOpen(true); })}>
                Generate New API Key
              </Item>
              <Item value="Copy Gateway Base URL" keywords={["endpoint", "url", "clipboard"]} icon={Link2} hint={GATEWAY_BASE_URL.replace("https://", "")} testId="command-item-copy-base-url" onSelect={() => run(() => copyText(GATEWAY_BASE_URL, "Gateway base URL copied"))}>
                Copy Gateway Base URL
              </Item>
              <Item value="Toggle Sidebar Collapse" keywords={["minimize", "expand", "rail"]} icon={PanelLeft} hint={`${MOD} B`} testId="command-item-toggle-sidebar" onSelect={() => run(toggleSidebar)}>
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </Item>
            </Command.Group>
          </Command.List>
          <footer className="flex items-center gap-4 border-t border-[var(--line)] px-4 py-2 font-mono text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5"><Kbd>Up</Kbd><Kbd>Down</Kbd> move</span>
            <span className="flex items-center gap-1.5"><Kbd><CornerDownLeft className="h-3 w-3" /></Kbd> select</span>
            <span className="flex items-center gap-1.5"><Kbd>Esc</Kbd> close</span>
          </footer>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
