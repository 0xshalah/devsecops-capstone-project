import Placeholder from "@/pages/Placeholder";
import { useHealth } from "@/components/StatusBadge";

export default function Health() {
  const { data, status } = useHealth();
  return (
    <Placeholder title="System status" body="Live response from the gateway health endpoint.">
      <pre data-testid="health-json" className="mt-10 max-w-xl overflow-x-auto rounded-lg border border-[var(--line)] bg-[#0c0c0f] p-5 font-mono text-[13px] text-zinc-300">
        {status === "checking" ? "Checking..." : data ? JSON.stringify(data, null, 2) : "Health endpoint unreachable."}
      </pre>
    </Placeholder>
  );
}
