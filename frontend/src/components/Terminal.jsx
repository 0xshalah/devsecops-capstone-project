import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { toast } from "sonner";
import { Code } from "@/components/Code";
import { SNIPPETS, RESPONSE } from "@/components/snippets";

const TABS = [
  { id: "curl", label: "cURL" },
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
];

const useTilt = () => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 120, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 120, damping: 18 });
  const onMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };
  return { style: { rotateX, rotateY, transformPerspective: 1200 }, onPointerMove: onMove, onPointerLeave: onLeave };
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast("Request copied to clipboard");
};

const Response = ({ state }) => {
  if (state === "idle") return <p className="font-mono text-[12.5px] text-zinc-500">Press Run to send the example request<span className="caret">_</span></p>;
  if (state === "running") return <p className="font-mono text-[12.5px] text-zinc-400">Routing request<span className="caret">_</span></p>;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px]">
        <span data-testid="terminal-status" className="text-[#9fd8a8]">200 OK</span>
        <span className="text-zinc-400">x-tollgate-route: openai</span>
        <span className="text-zinc-500">example response</span>
      </div>
      <Code source={RESPONSE} testId="terminal-json-response" />
    </motion.div>
  );
};

export const Terminal = () => {
  const [tab, setTab] = useState("curl");
  const [state, setState] = useState("idle");
  const timer = useRef(null);
  const tilt = useTilt();

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  const run = () => {
    clearTimeout(timer.current);
    setState("running");
    timer.current = setTimeout(() => setState("done"), 700);
  };

  return (
    <motion.div {...tilt} data-testid="interactive-terminal" className="overflow-hidden rounded-lg border border-[var(--line)] bg-[#0c0c0f] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] will-change-transform">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-3">
        <div className="flex" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} data-testid={`terminal-tab-${t.id}`} onClick={() => setTab(t.id)}
              className={`relative px-3 py-3 font-mono text-xs transition-colors duration-200 ${tab === t.id ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}>
              {t.label}
              {tab === t.id && <motion.span layoutId="tab-underline" className="absolute inset-x-3 -bottom-px h-px bg-[var(--accent)]" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button data-testid="terminal-copy-button" onClick={() => copyText(SNIPPETS[tab])} className="rounded-[4px] border border-[var(--line)] px-2.5 py-1 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100">Copy</button>
          <button data-testid="terminal-run-button" onClick={run} disabled={state === "running"} className="rounded-[4px] bg-zinc-100 px-2.5 py-1 font-mono text-xs font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-60">
            {state === "running" ? "Running" : "Run"}
          </button>
        </div>
      </div>
      <div className="min-h-[190px] px-4 py-4" data-testid="terminal-request">
        <Code source={SNIPPETS[tab]} testId={`terminal-code-${tab}`} />
      </div>
      <div className="min-h-[300px] border-t border-[var(--line)] bg-[#09090b] px-4 py-4" data-testid="terminal-output">
        <Response state={state} />
      </div>
    </motion.div>
  );
};
