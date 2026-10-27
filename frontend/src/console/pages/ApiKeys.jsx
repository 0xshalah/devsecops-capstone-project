import { useState } from "react";
import { Plus, KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useConsole } from "../ConsoleContext";
import { useKeys } from "../hooks/useGateway";
import { fmtAgo, fmtCompact, fmtDate, fmtInt, maskKey } from "../lib/format";
import { PageHeader, Panel, Skeleton, Td, Th, btnGhost, btnPrimary, btnSecondary } from "../components/ui";
import { toast } from "sonner";

const StatusPill = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs ${status === "active" ? "text-emerald-400" : "text-zinc-500"}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-emerald-400" : "bg-zinc-600"}`} />
    {status === "active" ? "Active" : "Revoked"}
  </span>
);

const ConfirmDialog = ({ target, onCancel, onConfirm }) => {
  const [pending, setPending] = useState(false);
  const isDelete = target?.status === "revoked";
  const go = async () => { setPending(true); await onConfirm(target); setPending(false); };
  return (
    <Dialog open={Boolean(target)} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent data-testid="key-confirm-dialog" className="max-w-[420px] gap-0 border-[var(--line-strong)] bg-[#0e0e11] p-0 sm:rounded-md">
        <div className="p-5">
          <DialogTitle className="text-[15px] font-semibold text-zinc-100">{isDelete ? "Delete key" : "Revoke key"}</DialogTitle>
          <DialogDescription className="mt-2 text-[13px] leading-relaxed text-zinc-400">
            {isDelete
              ? <>Remove <span className="font-mono text-zinc-200">{target?.name}</span> from this list. Audit log entries are kept.</>
              : <>Requests signed with <span className="font-mono text-zinc-200">{target && maskKey(target)}</span> will receive 401 immediately. This cannot be undone.</>}
          </DialogDescription>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-3">
          <button type="button" onClick={onCancel} data-testid="key-confirm-cancel" className={btnSecondary}>Cancel</button>
          <button type="button" onClick={go} disabled={pending} data-testid="key-confirm-submit" className="inline-flex h-8 items-center rounded-[5px] bg-rose-600 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-rose-500 disabled:opacity-50">
            {pending ? "Working..." : isDelete ? "Delete" : "Revoke key"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Empty = ({ onCreate }) => (
  <div data-testid="keys-empty-state" className="flex flex-col items-start gap-3 px-6 py-14">
    <KeyRound className="h-5 w-5 text-zinc-600" />
    <p className="text-sm text-zinc-300">No keys in this environment.</p>
    <button type="button" onClick={onCreate} data-testid="keys-empty-create-button" className={btnSecondary}>Create secret key</button>
  </div>
);

const KeyRow = ({ k, onAction }) => (
  <tr data-testid={`key-row-${k.id}`} className="border-b border-[var(--line)] last:border-0 hover:bg-zinc-900/50">
    <Td>
      <p className="font-mono text-zinc-100">{k.name}</p>
      <p className="tnum mt-0.5 font-mono text-[11px] text-zinc-500">{fmtAgo(k.lastUsed)}</p>
    </Td>
    <Td><code data-testid={`key-masked-${k.id}`} className="rounded-[3px] border border-[var(--line)] bg-[#0b0b0d] px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">{maskKey(k)}</code></Td>
    <Td className="tnum text-right font-mono text-zinc-300">{fmtInt(k.rpm)}</Td>
    <Td className="tnum text-right font-mono text-zinc-300" title={`${fmtInt(k.quota)} tokens`}>{fmtCompact(k.quota)}</Td>
    <Td className="tnum font-mono text-zinc-400">{fmtDate(k.createdAt)}</Td>
    <Td><StatusPill status={k.status} /></Td>
    <Td className="text-right">
      <button type="button" onClick={() => onAction(k)} data-testid={`key-${k.status === "active" ? "revoke" : "delete"}-${k.id}`} className={`${btnGhost} hover:text-rose-400`}>
        {k.status === "active" ? "Revoke" : "Delete"}
      </button>
    </Td>
  </tr>
);

export default function ApiKeys() {
  const { env, setCreateOpen, keysVersion } = useConsole();
  const { data, revoke, remove } = useKeys(env, keysVersion);
  const [target, setTarget] = useState(null);
  const confirm = async (k) => {
    if (k.status === "active") { await revoke(k.id); toast(`Revoked ${k.name}`); } else { await remove(k.id); toast(`Deleted ${k.name}`); }
    setTarget(null);
  };
  const create = () => setCreateOpen(true);

  return (
    <div data-testid="api-keys-page">
      <PageHeader
        title="API Keys"
        description={`Secret keys for the ${env} environment. Full tokens are shown once at creation.`}
        actions={<button type="button" onClick={create} data-testid="create-key-button" className={btnPrimary}><Plus className="h-3.5 w-3.5" />Create secret key</button>}
      />
      <div className="px-4 py-6 sm:px-8">
        <Panel testId="keys-table-panel">
          {!data ? <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-9" />)}</div> : data.length === 0 ? <Empty onCreate={create} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]" data-testid="keys-table">
                <thead className="border-b border-[var(--line)]">
                  <tr><Th>Name</Th><Th>Key</Th><Th className="text-right">Rate limit (RPM)</Th><Th className="text-right">Token quota / mo</Th><Th>Created</Th><Th>Status</Th><Th className="text-right">Action</Th></tr>
                </thead>
                <tbody>{data.map((k) => <KeyRow key={k.id} k={k} onAction={setTarget} />)}</tbody>
              </table>
            </div>
          )}
        </Panel>
        {data && <p className="tnum mt-3 font-mono text-[11px] text-zinc-500" data-testid="keys-count">{data.filter((k) => k.status === "active").length} active, {data.length} total</p>}
      </div>
      <ConfirmDialog target={target} onCancel={() => setTarget(null)} onConfirm={confirm} />
    </div>
  );
}
