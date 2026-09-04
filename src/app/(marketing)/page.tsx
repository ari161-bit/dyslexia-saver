import { Hero } from "@/components/marketing/hero";
import { ProblemSection, SolutionSection } from "@/components/marketing/problem-solution";
import { AudiencesSection } from "@/components/marketing/audiences";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { CTASection } from "@/components/marketing/cta-section";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <AudiencesSection />
      <HowItWorks />
      <CTASection />
    </>
  );
}
