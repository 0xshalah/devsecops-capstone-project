import { Link, useNavigate } from "react-router-dom";
import { Copy, KeyRound, LockKeyhole, Moon, Sun } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { usePrefs } from "@/preferences/PreferencesContext";
import { LANGS } from "@/i18n/dictionary";
import { useConsole } from "../ConsoleContext";
import { GATEWAY_BASE_URL } from "../nav";
import { MOD } from "../lib/format";
import { Kbd, PageHeader, Panel, Segmented, Switch, btnGhost, btnSecondary, copyText } from "../components/ui";

const Row = ({ title, hint, children }) => (
  <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-[13px] text-zinc-200">{title}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-2">{children}</div>
  </div>
);

const Appearance = () => {
  const { theme, setTheme, t } = usePrefs();
  const opt = (value, Icon) => ({ value, label: <span className="inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" strokeWidth={1.75} />{t(`settings.appearance.${value}`)}</span> });
  return (
    <Panel title={t("settings.appearance.title")} testId="settings-appearance-card">
      <Row title={t("settings.appearance.theme")} hint={t("settings.appearance.hint")}>
        <Segmented label={t("settings.appearance.theme")} testId="settings-theme" value={theme} onChange={setTheme} options={[opt("dark", Moon), opt("light", Sun)]} />
      </Row>
    </Panel>
  );
};

const Localization = () => {
  const { lang, setLang, t } = usePrefs();
  return (
    <Panel title={t("settings.localization.title")} testId="settings-localization-card">
      <Row title={t("settings.localization.language")} hint={t("settings.localization.hint")}>
        <Segmented label={t("settings.localization.language")} testId="settings-language" value={lang} onChange={setLang} options={LANGS.map((l) => ({ value: l.value, label: l.name }))} />
      </Row>
    </Panel>
  );
};

const AccountSecurity = () => {
  const { t } = usePrefs();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const reset = () => {
    const email = session?.email;
    signOut();
    navigate("/auth/forgot-password", { replace: true, state: { email } });
  };
  return (
    <Panel title={t("settings.security.title")} testId="settings-security-card">
      <Row title={t("settings.security.reset")} hint={t("settings.security.resetHint")}>
        <button type="button" onClick={reset} data-testid="settings-reset-password-button" className={btnSecondary}>
          <LockKeyhole className="h-3.5 w-3.5" strokeWidth={1.75} />{t("settings.security.resetAction")}
        </button>
      </Row>
      <Row title={t("settings.security.keys")} hint={t("settings.security.keysHint")}>
        <Link to="/console/keys" data-testid="settings-manage-keys-link" className={btnSecondary}>
          <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} />{t("settings.security.keysAction")}
        </Link>
      </Row>
    </Panel>
  );
};

const Gateway = () => {
  const { t } = usePrefs();
  const { env, setEnv, strictDefault, setStrictDefault, collapsed, toggleSidebar } = useConsole();
  return (
    <Panel title={t("settings.gateway.title")} testId="settings-gateway-card">
      <Row title={t("settings.gateway.env")} hint={t("settings.gateway.envHint")}>
        <Segmented label={t("settings.gateway.env")} testId="settings-env" value={env} onChange={setEnv} options={[{ value: "live", label: "live" }, { value: "test", label: "test" }]} />
      </Row>
      <Row title={t("settings.gateway.baseUrl")} hint={t("settings.gateway.baseUrlHint")}>
        <code className="font-mono text-[12.5px] text-zinc-300">{GATEWAY_BASE_URL}</code>
        <button type="button" aria-label="Copy base URL" data-testid="settings-copy-base-url" onClick={() => copyText(GATEWAY_BASE_URL, t("settings.gateway.copied"))} className={btnGhost}><Copy className="h-3.5 w-3.5" /></button>
      </Row>
      <Row title={t("settings.gateway.strict")} hint={t("settings.gateway.strictHint")}>
        <Switch checked={strictDefault} onChange={setStrictDefault} label={t("settings.gateway.strict")} testId="settings-strict-default" />
      </Row>
      <Row title={t("settings.gateway.collapsed")} hint={t("settings.gateway.collapsedHint")}>
        <Switch checked={collapsed} onChange={toggleSidebar} label={t("settings.gateway.collapsed")} testId="settings-sidebar-collapsed" />
      </Row>
    </Panel>
  );
};

const Shortcuts = () => {
  const { t } = usePrefs();
  const rows = [["palette", `${MOD} K`], ["sidebar", `${MOD} B`], ["send", `${MOD} Enter`]];
  return (
    <Panel title={t("settings.shortcuts.title")} testId="settings-shortcuts">
      {rows.map(([k, keys]) => <Row key={k} title={t(`settings.shortcuts.${k}`)}><Kbd>{keys}</Kbd></Row>)}
    </Panel>
  );
};

export default function Settings() {
  const { t } = usePrefs();
  return (
    <div data-testid="settings-page">
      <PageHeader title={t("console.nav.settings")} description={t("settings.desc")} />
      <div className="max-w-3xl space-y-5 px-4 py-6 sm:px-8">
        <Appearance />
        <Localization />
        <AccountSecurity />
        <Gateway />
        <Shortcuts />
      </div>
    </div>
  );
}
