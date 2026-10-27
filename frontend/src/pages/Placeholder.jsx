import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Placeholder({ title, body, children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-24 sm:px-8" data-testid="placeholder-page">
        <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-zinc-100 sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-xl text-base text-zinc-400 md:text-lg">{body}</p>
        {children}
        <Link to="/" data-testid="placeholder-back-link" className="mt-10 inline-block text-sm text-[var(--accent-ink)] hover:text-zinc-100">Back to home</Link>
      </main>
      <Footer />
    </div>
  );
}
