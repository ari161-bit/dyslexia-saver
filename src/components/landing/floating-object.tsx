"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function FloatingObject({
  icon: Icon,
  title,
  description,
  delay = 0,
  index = 0,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  index?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const }}
      className="group relative"
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 5 + (index % 3), repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-3xl border border-stone-200 bg-white p-7 shadow-sm transition-all duration-500 group-hover:-translate-y-0.5 group-hover:border-orange-300 group-hover:shadow-lg"
      >
        <div
          className="absolute inset-0 -z-10 rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: "radial-gradient(circle at 30% 20%, rgba(249,115,22,0.16), transparent 70%)" }}
        />
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-600">
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-5 font-heading text-base font-semibold text-stone-900">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">{description}</p>
      </motion.div>
    </motion.div>
  );
}
