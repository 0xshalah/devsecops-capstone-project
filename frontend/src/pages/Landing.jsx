import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Capabilities } from "@/components/Capabilities";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-clip" data-testid="landing-page">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Capabilities />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
