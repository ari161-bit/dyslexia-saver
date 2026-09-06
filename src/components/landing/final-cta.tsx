import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-36 sm:py-44">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_50%,rgba(255,255,255,0.18),transparent)]" />

      <Reveal className="relative mx-auto max-w-3xl text-center">
        <h2 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
          Make accessible learning
          <br />
          the default.
        </h2>

        <Link
          href="/signup"
          className="group mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-orange-600 transition-all duration-300 hover:bg-orange-50 hover:shadow-[0_0_50px_rgba(255,255,255,0.4)]"
        >
          Explore the platform
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>

        <p className="mt-14 text-sm leading-relaxed text-white/80">
          Students learn.
          <br />
          Teachers adapt.
          <br />
          Parents understand.
          <br />
          Schools coordinate.
        </p>
      </Reveal>
    </section>
  );
}
