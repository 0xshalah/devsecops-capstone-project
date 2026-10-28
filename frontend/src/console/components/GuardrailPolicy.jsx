import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, ShieldCheck } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { usePrefs } from "@/preferences/PreferencesContext";
import { gatewayApi } from "../services/gatewayApi";
import { Panel, Segmented, SettingRow as Row, Skeleton, Switch, btnPrimary, btnSecondary, inputCls } from "./ui";

const EDIT_ROLES = ["Owner", "Admin"];
const PII_KEYS = ["email", "phone", "creditCard", "nationalId", "secrets"];
const pick = ({ defaultAction, injectionThreshold, piiRedaction, toxicityFilter, globalRateLimit }) => (
  { defaultAction, injectionThreshold: Number(injectionThreshold), piiRedaction, toxicityFilter, globalRateLimit: Number(globalRateLimit) }
);

const PolicyFields = ({ draft, set, t }) => (
  <>
    <Row title={t("settings.policy.action")} hint={t("settings.policy.actionHint")}>
      <Segmented label={t("settings.policy.action")} testId="policy-default-action" value={draft.defaultAction} onChange={(v) => set({ defaultAction: v })}
        options={["block", "redact", "flag"].map((v) => ({ value: v, label: t(`settings.policy.${v}`) }))} />
    </Row>
    <Row title={t("settings.policy.threshold")} hint={t("settings.policy.thresholdHint")}>
      <input type="range" min="0.05" max="1" step="0.05" value={draft.injectionThreshold} onChange={(e) => set({ injectionThreshold: Number(e.target.value) })} data-testid="policy-threshold-slider" className="w-36 accent-[var(--accent)]" aria-label={t("settings.policy.threshold")} />
      <span data-testid="policy-threshold-value" className="tnum w-10 text-right font-mono text-xs text-zinc-300">{Number(draft.injectionThreshold).toFixed(2)}</span>
    </Row>
    <Row title={t("settings.policy.pii")} hint={t("settings.policy.piiHint")}>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3">
        {PII_KEYS.map((k) => (
          <label key={k} className="flex items-center gap-2 text-xs text-zinc-400">
            <Switch checked={draft.piiRedaction[k]} onChange={(v) => set({ piiRedaction: { ...draft.piiRedaction, [k]: v } })} label={t(`settings.policy.${k}`)} testId={`policy-pii-${k}`} />
            {t(`settings.policy.${k}`)}
          </label>
        ))}
      </div>
    </Row>
    <Row title={t("settings.policy.toxicity")} hint={t("settings.policy.toxicityHint")}>
      <Switch checked={draft.toxicityFilter} onChange={(v) => set({ toxicityFilter: v })} label={t("settings.policy.toxicity")} testId="policy-toxicity-filter" />
    </Row>
    <Row title={t("settings.policy.rateLimit")} hint={t("settings.policy.rateLimitHint")}>
      <input type="number" min="1" max="1000000" value={draft.globalRateLimit} onChange={(e) => set({ globalRateLimit: e.target.value })} data-testid="policy-rate-limit-input" className={`${inputCls} h-8 w-32 py-1 font-mono text-xs`} aria-label={t("settings.policy.rateLimit")} />
      <span className="font-mono text-[11px] text-zinc-500">req/min</span>
    </Row>
  </>
);

export const GuardrailPolicy = () => {
  const { t } = usePrefs();
  const { session } = useAuth();
  const canEdit = EDIT_ROLES.includes(session?.role);
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    gatewayApi.getSettings().then((s) => { setSaved(s); setDraft(s); }).catch((e) => toast.error(e.message));
  }, []);

  if (!draft) return <Skeleton className="h-[360px]" />;
  const dirty = JSON.stringify(pick(draft)) !== JSON.stringify(pick(saved));
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const save = async () => {
    setSaving(true);
    try {
      const s = await gatewayApi.updateSettings(pick(draft));
      setSaved(s); setDraft(s); toast(t("settings.policy.saved"));
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Panel title={t("settings.policy.title")} testId="settings-policy-card" action={<ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />}>
      <p data-testid="policy-scope-hint" className="border-b border-[var(--line)] px-4 py-3 text-xs text-zinc-500">{canEdit ? t("settings.policy.hint") : t("settings.policy.readOnly")}</p>
      <fieldset disabled={!canEdit || saving} className="min-w-0 disabled:opacity-60">
        <PolicyFields draft={draft} set={set} t={t} />
      </fieldset>
      {canEdit && (
        <div className="flex justify-end gap-2 border-t border-[var(--line)] px-4 py-3">
          <button type="button" disabled={!dirty || saving} onClick={() => setDraft(saved)} data-testid="policy-discard-button" className={btnSecondary}>{t("settings.policy.discard")}</button>
          <button type="button" disabled={!dirty || saving} onClick={save} data-testid="policy-save-button" className={btnPrimary}><Save className="h-3.5 w-3.5" />{saving ? t("settings.policy.saving") : t("settings.policy.save")}</button>
        </div>
      )}
    </Panel>
  );
};
