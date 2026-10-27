import { useRef } from "react";

export const Spotlight = () => {
  const ref = useRef(null);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--x", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  return (
    <figure
      ref={ref}
      onPointerMove={onMove}
      data-testid="capability-photo"
      className="relative h-full min-h-[320px] overflow-hidden rounded-lg border border-[var(--line)] bg-black [--x:50%] [--y:40%]"
      style={{ clipPath: "polygon(0 0, 100% 0, 100% 86%, 82% 100%, 0 100%)" }}
    >
      <img src="/img/rack.jpg" alt="Network cabling in a server rack" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 hover:scale-105" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(260px circle at var(--x) var(--y), transparent 0%, rgba(9,9,11,0.82) 70%)" }} />
      <figcaption className="absolute bottom-5 left-5 font-mono text-xs text-zinc-300">Runs inside your network</figcaption>
    </figure>
  );
};
