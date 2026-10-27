import { MARQUEE } from "@/content";

const Row = ({ hidden }) => (
  <div className="flex shrink-0 items-center" aria-hidden={hidden}>
    {MARQUEE.map((item) => (
      <span key={item} className="flex items-center whitespace-nowrap">
        <span className="px-8 font-display text-4xl font-semibold tracking-[-0.03em] text-zinc-300 sm:text-6xl">{item}</span>
        <span className="h-2 w-2 bg-[var(--accent)]" />
      </span>
    ))}
  </div>
);

export const Marquee = () => (
  <section data-testid="editorial-marquee" aria-label="Gateway capabilities" className="marquee-wrap overflow-hidden border-y border-[var(--line)] py-10">
    <div className="marquee-track flex w-max">
      <Row />
      <Row hidden />
    </div>
  </section>
);
