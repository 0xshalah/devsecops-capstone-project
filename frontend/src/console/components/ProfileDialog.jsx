import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/auth/AuthContext";
import { PROFILE } from "@/constants/testIds";
import { useConsole } from "../ConsoleContext";
import { btnGhost, btnPrimary, btnSecondary, copyText, inputCls, labelCls } from "./ui";
import { PlanBadge } from "./AccountMenu";

const IdRow = ({ label, value, testId, copyId }) => (
  <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2.5 last:border-0">
    <span className="text-xs text-zinc-500">{label}</span>
    <div className="flex min-w-0 items-center gap-1">
      <code data-testid={testId} className="truncate font-mono text-[12px] text-zinc-300">{value}</code>
      <button type="button" aria-label={`Copy ${label}`} data-testid={copyId} onClick={() => copyText(value, `${label} copied`)} className={btnGhost}>
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

const ProfileForm = ({ onClose }) => {
  const { session, updateProfile } = useAuth();
  const [name, setName] = useState(session.name);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = name.trim() !== session.name;

  const edit = (setter, key) => (e) => { setter(e.target.value); setErrors((x) => ({ ...x, [key]: "" })); setSaved(false); };

  const submit = async (e) => {
    e.preventDefault();
    const next = { name: name.trim() ? "" : "Display name is required." };
    setErrors(next);
    if (next.name) return;
    setPending(true);
    try {
      await updateProfile({ name: name.trim() });
      setSaved(true);
    } catch (err) {
      setErrors({ name: err.message });
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate data-testid={PROFILE.form} className="space-y-5 p-5">
      <div>
        <label htmlFor="profile-name" className={labelCls}>Display name</label>
        <input id="profile-name" maxLength={64} value={name} onChange={edit(setName, "name")} data-testid={PROFILE.nameInput} className={inputCls} />
        {errors.name && <p data-testid={PROFILE.nameError} className="mt-1.5 text-xs text-rose-400">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="profile-email" className={labelCls}>Email address</label>
        <input id="profile-email" type="email" value={session.email} readOnly aria-readonly="true" data-testid={PROFILE.emailInput} className={`${inputCls} cursor-not-allowed font-mono opacity-70`} />
        <p className="mt-1.5 text-[11px] text-zinc-600">Sign-in email cannot be changed here.</p>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className={labelCls.replace("mb-1.5 ", "")}>Identifiers</span>
          <PlanBadge plan={session.plan} testId={PROFILE.plan} />
        </div>
        <div className="rounded-[5px] border border-[var(--line)] bg-[#0b0b0d]">
          <IdRow label="User ID" value={session.id} testId={PROFILE.userId} copyId={PROFILE.copyUserId} />
          <IdRow label="Organization ID" value={session.orgId} testId={PROFILE.orgId} copyId={PROFILE.copyOrgId} />
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-600">Identifiers are read only. Include them when contacting support.</p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <span aria-live="polite" className="text-xs">
          {saved && (
            <span data-testid={PROFILE.success} className="inline-flex items-center gap-1.5 text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Changes saved successfully
            </span>
          )}
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} data-testid={PROFILE.cancelButton} className={btnSecondary}>Close</button>
          <button type="submit" disabled={pending || !dirty} data-testid={PROFILE.saveButton} className={btnPrimary}>{pending ? "Saving..." : "Save changes"}</button>
        </div>
      </div>
    </form>
  );
};

export const ProfileDialog = () => {
  const { profileOpen, setProfileOpen } = useConsole();
  const [formKey, setFormKey] = useState(0);
  useEffect(() => { if (profileOpen) setFormKey((k) => k + 1); }, [profileOpen]);

  return (
    <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
      <DialogContent data-testid={PROFILE.dialog} className="max-w-[480px] gap-0 border-[var(--line-strong)] bg-[#0e0e11] p-0 sm:rounded-md">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <DialogTitle className="text-[15px] font-semibold text-zinc-100">Profile Settings</DialogTitle>
          <DialogDescription className="mt-1 text-xs text-zinc-500">Update how you appear across the console.</DialogDescription>
        </div>
        <ProfileForm key={formKey} onClose={() => setProfileOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
