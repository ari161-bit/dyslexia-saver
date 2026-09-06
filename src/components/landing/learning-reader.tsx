"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ear, Lightbulb, Sparkles } from "lucide-react";
import { Reveal, SectionEyebrow, SectionHeading } from "./reveal";

type Mode = "read" | "explain" | "practice";

const MODES: { key: Mode; label: string; icon: typeof Ear }[] = [
  { key: "read", label: "Read", icon: Ear },
  { key: "explain", label: "Explain", icon: Lightbulb },
  { key: "practice", label: "Practice", icon: Sparkles },
];

export function LearningReader() {
  const [mode, setMode] = useState<Mode>("read");

  return (
    <section className="relative bg-white px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <SectionEyebrow>PRODUCT EXPERIENCE</SectionEyebrow>
          <SectionHeading>A reader that adapts, without hiding the source.</SectionHeading>
        </Reveal>
      </div>

      <Reveal delay={0.15} className="mx-auto mt-16 max-w-2xl">
        <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 px-7 py-5">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.25em] text-orange-600">SCIENCE · LESSON 4</p>
              <p className="mt-1 font-heading text-sm font-medium text-stone-900">The Water Cycle</p>
            </div>
            <div className="hidden items-center gap-3 text-[11px] text-stone-400 sm:flex">
              <span>Aa 18pt</span>
              <span className="h-3 w-px bg-stone-200" />
              <span>Line 1.6</span>
              <span className="h-3 w-px bg-stone-200" />
              <span>Focus mode</span>
            </div>
          </div>

          <div className="relative min-h-[160px] px-7 py-8 sm:px-10">
            <AnimatePresence mode="wait">
              {mode === "read" && (
                <motion.p
                  key="read"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="text-xl leading-relaxed text-stone-700"
                >
                  The water cycle moves water through the atmosphere, land and oceans.
                </motion.p>
              )}
              {mode === "explain" && (
                <motion.div
                  key="explain"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-2xl border border-orange-200 bg-orange-50 p-5"
                >
                  <p className="text-sm font-semibold text-orange-700">Atmosphere</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-stone-700">
                    &ldquo;Atmosphere&rdquo; means the layer of gases around Earth.
                  </p>
                </motion.div>
              )}
              {mode === "practice" && (
                <motion.div
                  key="practice"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-3"
                >
                  <p className="text-[15px] font-medium text-stone-800">
                    The water cycle moves water through the _____, land and oceans.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["atmosphere", "sunlight", "roots"].map((opt) => (
                      <span
                        key={opt}
                        className="rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs text-stone-600"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-stone-200 px-7 py-5 sm:px-10">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-300 ${
                  mode === m.key
                    ? "border-orange-300 bg-orange-500 text-white"
                    : "border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-800"
                }`}
              >
                <m.icon className="h-3.5 w-3.5" />
                {m.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] font-semibold tracking-[0.3em] text-orange-500">
          SOURCE STAYS VISIBLE
        </p>
      </Reveal>
    </section>
  );
}
