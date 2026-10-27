import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, className = "", ...rest }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    {...rest}
  >
    {children}
  </motion.div>
);

export const SectionHead = ({ index, label, title, body }) => (
  <Reveal className="mb-14 grid gap-6 md:grid-cols-12">
    <p className="font-mono text-xs text-zinc-400 md:col-span-3"><span className="text-[var(--accent)]">{index}</span> {label}</p>
    <div className="md:col-span-9">
      <h2 className="max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-[-0.03em] text-zinc-100 sm:text-5xl">{title}</h2>
      {body && <p className="mt-5 max-w-xl text-base text-zinc-400 md:text-lg">{body}</p>}
    </div>
  </Reveal>
);
