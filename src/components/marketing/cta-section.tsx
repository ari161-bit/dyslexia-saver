import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground sm:px-16">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10" aria-hidden />
        <h2 className="relative font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Make learning more accessible.
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-primary-foreground/85">
          Join the students, teachers, parents, and schools already building a classroom that
          adapts — instead of asking learners to.
        </p>
        <Button size="lg" variant="secondary" className="relative mt-8" asChild>
          <Link href="/signup">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
