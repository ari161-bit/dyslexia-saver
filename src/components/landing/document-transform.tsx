"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { BookOpen, Ear, Lightbulb, Sparkles, Target } from "lucide-react";
import { SectionHeading, SectionEyebrow } from "./reveal";

const STATES = [
  {
    key: "READ",
    icon: BookOpen,
    body: "Plants make their own food using sunlight, water, and air. This process is called photosynthesis.",
  },
  {
    key: "EXPLAIN",
    icon: Lightbulb,
    body: "In simple terms: plants turn sunlight into food, the same way a solar panel turns sunlight into power.",
  },
  {
    key: "LISTEN",
    icon: Ear,
    body: "▶ Now playing — \"Plants make their own food using sunlight, water, and air…\"",
  },
  {
    key: "FOCUS",
    icon: Target,
    body: "Plants make their own food using sunlight, water, and air.",
    focus: true,
  },
  {
    key: "PRACTICE",
    icon: Sparkles,
    body: "What do plants use, besides sunlight, to make their own food?  →  water and air",
  },
];

export function DocumentTransform() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(STATES.length - 1, Math.floor(v * STATES.length));
    setActive(idx);
  });

  return (
    <section id="product" ref={ref} className="relative bg-white" style={{ height: `${STATES.length * 70}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_45%,rgba(249,115,22,0.08),transparent)]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <SectionEyebrow>THE PRODUCT</SectionEyebrow>
          <SectionHeading>
            One school resource.
            <br />
            Multiple ways to learn.
          </SectionHeading>
        </div>

        <div className="relative z-10 mt-14 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          <div className="flex flex-row justify-center gap-2 md:flex-col md:justify-start">
            {STATES.map((s, i) => (
              <div
                key={s.key}
                className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-500 md:rounded-2xl ${
                  i === active
                    ? "border-orange-300 bg-orange-50 text-stone-900 shadow-[0_0_24px_rgba(249,115,22,0.16)]"
                    : "border-stone-200 bg-stone-50 text-stone-400"
                }`}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{s.key}</span>
              </div>
            ))}
          </div>

          <div className="relative min-h-[220px] rounded-[1.75rem] border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-stone-400">SCIENCE · GRADE 7</p>
            {STATES.map((s, i) => (
              <motion.p
                key={s.key}
                initial={false}
                animate={{ opacity: i === active ? 1 : 0, y: i === active ? 0 : 8 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                className={`absolute inset-x-8 top-16 text-lg leading-relaxed sm:inset-x-10 sm:text-xl ${
                  s.focus ? "text-stone-900" : "text-stone-700"
                }`}
                style={i === active ? {} : { pointerEvents: "none" }}
              >
                {s.body}
              </motion.p>
            ))}
          </div>
        </div>

        <p className="relative z-10 mt-8 text-[11px] font-semibold tracking-[0.3em] text-orange-500">
          SOURCE STAYS VISIBLE
        </p>
      </div>
    </section>
  );
}
