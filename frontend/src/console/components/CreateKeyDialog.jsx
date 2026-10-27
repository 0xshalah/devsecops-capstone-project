import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useConsole } from "../ConsoleContext";
import { gatewayApi } from "../services/gatewayApi";
import { fmtInt } from "../lib/format";
import { Segmented, btnPrimary, btnSecondary, copyText, inputCls, labelCls } from "./ui";

const RPM = [{ value: 60, label: "60" }, { value: 600, label: "600" }, { value: 3000, label: "3,000" }];
const QUOTAS = [1000000, 10000000, 50000000];

const KeyForm = ({ onCreated }) => {
  const { env } = useConsole();
  const [name, setName] = useState("");
  const [rpm, setRpm] = useState(600);
  const [quota, setQuota] = useState("10000000");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const q = Number(quota);
    if (!name.trim()) return setError("Name is required.");
    if (!Number.isInteger(q) || q < 1000) return setError("Token quota must be a whole number of at least 1,000.");
    setPending(true);
    const res = await gatewayApi.createKey({ name: name.trim(), rpm, quota: q, env });
    setPending(false);
    onCreated(res);
  };

  return (
    <form onSubmit={submit} className="space-y-5 p-5" data-testid="create-key-form">
      <div>
        <label htmlFor="key-name" className={labelCls}>Name</label>
        <input id="key-name" autoFocus maxLength={48} value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="payments-service" data-testid="create-key-name-input" className={`${inputCls} font-mono`} />
      </div>
      <div>
        <span className={labelCls}>Rate limit (requests per minute)</span>
        <Segmented label="Rate limit" options={RPM} value={rpm} onChange={setRpm} testId="create-key-rpm" />
      </div>
      <div>
        <label htmlFor="key-quota" className={labelCls}>Monthly token quota</label>
        <input id="key-quota" inputMode="numeric" value={quota} onChange={(e) => { setQuota(e.target.value.replace(/[^\d]/g, "")); setError(""); }} data-testid="create-key-quota-input" className={`${inputCls} tnum font-mono`} />
        <div className="mt-2 flex gap-1.5">
          {QUOTAS.map((q) => (
            <button key={q} type="button" onClick={() => setQuota(String(q))} data-testid={`create-key-quota-preset-${q}`} className="rounded-[3px] border border-[var(--line)] px-2 py-0.5 font-mono text-[11px] text-zinc-400 transition-colors hover:border-[var(--line-strong)] hover:text-zinc-200">
              {fmtInt(q)}
            </button>
          ))}
        </div>
      </div>
      {error && <p data-testid="create-key-error" className="text-xs text-rose-400">{error}</p>}
      <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
        <span className="font-mono text-[11px] text-zinc-500">prefix nx_{env}_</span>
        <button type="submit" disabled={pending} data-testid="create-key-submit-button" className={btnPrimary}>{pending ? "Generating..." : "Generate key"}</button>
      </div>
    </form>
  );
};

const KeyReveal = ({ secret, keyName, onDone }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await copyText(secret, "Secret key copied"); setCopied(true); };
  return (
    <div className="space-y-4 p-5" data-testid="create-key-reveal">
      <div className="flex gap-2.5 rounded-[5px] border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-200/90">
        <TriangleAlert className="mt-px h-4 w-4 shrink-0 text-amber-400" />
        <p>Copy this key now and store it in a secrets manager. It will not be shown again after you close this dialog.</p>
      </div>
      <div>
        <span className={labelCls}>Secret key for {keyName}</span>
        <div className="flex items-stretch overflow-hidden rounded-[5px] border border-[var(--line-strong)] bg-[#0b0b0d]">
          <code data-testid="create-key-secret" className="flex-1 break-all px-3 py-2.5 font-mono text-[12.5px] text-zinc-100">{secret}</code>
          <button type="button" onClick={copy} data-testid="create-key-copy-button" className="flex w-24 shrink-0 items-center justify-center gap-1.5 border-l border-[var(--line-strong)] text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <div className="flex justify-end border-t border-[var(--line)] pt-4">
        <button type="button" onClick={onDone} data-testid="create-key-done-button" className={btnSecondary}>Done</button>
      </div>
    </div>
  );
};

export const CreateKeyDialog = () => {
  const { createOpen, setCreateOpen, bumpKeys } = useConsole();
  const [created, setCreated] = useState(null);
  const onOpenChange = (open) => {
    setCreateOpen(open);
    if (!open) setTimeout(() => setCreated(null), 200);
  };
  const onCreated = (res) => { setCreated(res); bumpKeys(); };

  return (
    <Dialog open={createOpen} onOpenChange={onOpenChange}>
      <DialogContent data-testid="create-key-dialog" className="max-w-[460px] gap-0 border-[var(--line-strong)] bg-[#0e0e11] p-0 sm:rounded-md">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <DialogTitle className="text-[15px] font-semibold text-zinc-100">{created ? "Key created" : "Create secret key"}</DialogTitle>
          <DialogDescription className="mt-1 text-xs text-zinc-500">{created ? "One time view of the full token." : "Keys inherit the active environment."}</DialogDescription>
        </div>
        {created ? <KeyReveal secret={created.secret} keyName={created.key.name} onDone={() => onOpenChange(false)} /> : <KeyForm onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  );
};
