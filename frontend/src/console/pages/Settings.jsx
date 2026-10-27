import { Copy } from "lucide-react";
import { useConsole } from "../ConsoleContext";
import { GATEWAY_BASE_URL } from "../nav";
import { MOD } from "../lib/format";
import { Kbd, PageHeader, Panel, Segmented, Switch, btnGhost, copyText } from "../components/ui";

const Row = ({ title, hint, children }) => (
  <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-[13px] text-zinc-200">{title}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </div>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

const SHORTCUTS = [
  ["Open command palette", `${MOD} K`],
  ["Collapse or expand sidebar", `${MOD} B`],
  ["Send playground request", `${MOD} Enter`],
];

export default function Settings() {
  const { env, setEnv, strictDefault, setStrictDefault, collapsed, toggleSidebar } = useConsole();
  return (
    <div data-testid="settings-page">
      <PageHeader title="Settings" description="Console preferences for this browser." />
      <div className="max-w-3xl space-y-5 px-4 py-6 sm:px-8">
        <Panel title="Gateway">
          <Row title="Environment" hint="API keys are listed and created for the selected environment.">
            <Segmented label="Environment" testId="settings-env" value={env} onChange={setEnv} options={[{ value: "live", label: "live" }, { value: "test", label: "test" }]} />
          </Row>
          <Row title="Base URL" hint="Use this as the OpenAI compatible base URL in your client.">
            <code className="font-mono text-[12.5px] text-zinc-300">{GATEWAY_BASE_URL}</code>
            <button type="button" aria-label="Copy base URL" data-testid="settings-copy-base-url" onClick={() => copyText(GATEWAY_BASE_URL, "Gateway base URL copied")} className={btnGhost}><Copy className="h-3.5 w-3.5" /></button>
          </Row>
          <Row title="Strict guardrail by default" hint="Playground starts with the prompt injection guardrail enforced.">
            <Switch checked={strictDefault} onChange={setStrictDefault} label="Strict guardrail by default" testId="settings-strict-default" />
          </Row>
          <Row title="Collapsed sidebar" hint="Saved in this browser.">
            <Switch checked={collapsed} onChange={toggleSidebar} label="Collapsed sidebar" testId="settings-sidebar-collapsed" />
          </Row>
        </Panel>
        <Panel title="Keyboard shortcuts" testId="settings-shortcuts">
          {SHORTCUTS.map(([label, keys]) => (
            <Row key={label} title={label}><Kbd>{keys}</Kbd></Row>
          ))}
        </Panel>
      </div>
    </div>
  );
}
