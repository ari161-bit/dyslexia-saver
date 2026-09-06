"use client";

import { motion, useReducedMotion } from "framer-motion";

const LABELS = [
  { text: "READ", className: "left-[12%] top-[28%]" },
  { text: "LISTEN", className: "right-[10%] top-[38%]" },
  { text: "EXPLAIN", className: "left-[16%] top-[62%]" },
  { text: "PRACTICE", className: "right-[14%] top-[68%]" },
  { text: "FOCUS", className: "left-1/2 top-[15%] -translate-x-1/2" },
];

export function HeroFallback() {
  const reduced = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 h-[340px] w-[260px] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={reduced ? undefined : { rotate: [0, 2, 0, -2, 0], y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="relative h-full w-full rounded-[1.5rem] border border-orange-200 bg-white shadow-[0_20px_80px_rgba(249,115,22,0.18)]"
        >
          <div className="absolute inset-y-6 left-6 w-1.5 rounded-full bg-gradient-to-b from-orange-400 to-orange-600" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 pl-10">
            {[70, 90, 55, 80, 60].map((w, i) => (
              <div
                key={i}
                className={`h-2 rounded-full ${i === 0 ? "bg-orange-300" : "bg-stone-200"}`}
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </motion.div>
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-orange-400/25 blur-3xl" />
      </div>

      {LABELS.map((label, i) => (
        <motion.div
          key={label.text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 + i * 0.15 }}
          className={`absolute rounded-full border border-orange-200 bg-white/90 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-orange-700 shadow-sm backdrop-blur-md ${label.className}`}
        >
          {label.text}
        </motion.div>
      ))}
    </div>
  );
}
