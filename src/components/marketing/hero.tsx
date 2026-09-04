import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroMockup } from "./hero-mockup";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/50 to-background" aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Built for students with dyslexia — and the people who support them
          </span>
          <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Learning should adapt to the learner.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            An intelligent learning support platform helping students, teachers, parents and
            schools create a more accessible learning experience.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#solution">
                <PlayCircle className="h-4 w-4" /> See How It Works
              </a>
            </Button>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
            <div>
              <p className="font-heading text-xl font-semibold text-foreground">4</p>
              <p>connected roles</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="font-heading text-xl font-semibold text-foreground">7</p>
              <p>ways to adapt a lesson</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="font-heading text-xl font-semibold text-foreground">0</p>
              <p>diagnoses made</p>
            </div>
          </div>
        </div>
        <HeroMockup />
      </div>
    </section>
  );
}
