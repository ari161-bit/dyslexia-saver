import type { Metadata } from "next";
import { DarkHeader } from "@/components/landing/dark-header";
import { DarkFooter } from "@/components/landing/dark-footer";
import { Hero3D } from "@/components/landing/hero-3d";
import { ProblemSection } from "@/components/landing/problem-section";
import { DocumentTransform } from "@/components/landing/document-transform";
import { LearningLoop } from "@/components/landing/learning-loop";
import { LearningReader } from "@/components/landing/learning-reader";
import { TrustSection } from "@/components/landing/trust-section";
import { Roadmap } from "@/components/landing/roadmap";
import { VisionSection } from "@/components/landing/vision-section";
import { FinalCTA } from "@/components/landing/final-cta";

export const metadata: Metadata = {
  title: "Brightpath — Learning that adapts to the learner",
  description: "One connected experience for students, teachers, parents and schools.",
};

export default function LandingPage() {
  return (
    <div className="bg-white">
      <DarkHeader />
      <main>
        <Hero3D />
        <ProblemSection />
        <DocumentTransform />
        <LearningLoop />
        <LearningReader />
        <div id="trust">
          <TrustSection />
        </div>
        <Roadmap />
        <VisionSection />
        <FinalCTA />
      </main>
      <DarkFooter />
    </div>
  );
}
