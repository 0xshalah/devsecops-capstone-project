import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Capabilities } from "@/components/Capabilities";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { ClosingCta } from "@/components/ClosingCta";
import { Footer } from "@/components/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-clip" data-testid="landing-page">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Capabilities />
        <HowItWorks />
        <Pricing />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
