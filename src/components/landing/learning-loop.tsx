"use client";

import { motion } from "framer-motion";
import { Baby, GraduationCap, School, User } from "lucide-react";
import { Reveal, SectionEyebrow, SectionHeading } from "./reveal";

const ROLES = [
  { icon: User, title: "STUDENT", copy: "Learns in the format that fits.", pos: "top-0 left-1/2 -translate-x-1/2" },
  { icon: GraduationCap, title: "TEACHER", copy: "Adapts once, reviews and assigns.", pos: "top-1/2 right-0 -translate-y-1/2" },
  { icon: Baby, title: "PARENT", copy: "Sees progress without noise.", pos: "bottom-0 left-1/2 -translate-x-1/2" },
  { icon: School, title: "SCHOOL", copy: "Coordinates access and support.", pos: "top-1/2 left-0 -translate-y-1/2" },
];

export function LearningLoop() {
  return (
    <section className="relative overflow-hidden bg-stone-50 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <SectionEyebrow>ONE CONNECTED LEARNING LOOP</SectionEyebrow>
          <SectionHeading>Everyone works from the same loop.</SectionHeading>
        </Reveal>
      </div>

      {/* The circular layout positions fixed-width cards around a ring, which
          only has room to breathe above the sm breakpoint — on phones it
          collapses into overlapping cards that cover the center label, so
          mobile gets a simple 2x2 grid instead. */}
      <div className="mx-auto mt-16 grid max-w-md grid-cols-2 gap-4 sm:hidden">
        {ROLES.map((role, i) => (
          <motion.div
            key={role.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const }}
            className="rounded-2xl border border-stone-200 bg-white p-4 text-center shadow-sm"
          >
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600">
              <role.icon className="h-4 w-4" />
            </span>
            <p className="mt-2.5 font-heading text-xs font-semibold tracking-wide text-stone-900">{role.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-stone-500">{role.copy}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative mx-auto mt-24 hidden aspect-square w-full max-w-[560px] sm:block">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(249,115,22,0.18)" strokeWidth="0.5" strokeDasharray="1.5 2.5" />
          <motion.circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="rgba(234,88,12,0.7)"
            strokeWidth="0.6"
            strokeDasharray="6 232"
            animate={{ strokeDashoffset: [0, -238] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-orange-200 bg-white text-center shadow-sm">
          <p className="font-heading text-sm font-semibold leading-tight text-stone-900">
            ONE
            <br />
            LEARNING
            <br />
            LOOP
          </p>
        </div>

        {ROLES.map((role, i) => (
          <motion.div
            key={role.title}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as const }}
            className={`absolute w-44 rounded-2xl border border-stone-200 bg-white p-4 text-center shadow-sm ${role.pos}`}
          >
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600">
              <role.icon className="h-4 w-4" />
            </span>
            <p className="mt-2.5 font-heading text-xs font-semibold tracking-wide text-stone-900">{role.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-stone-500">{role.copy}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
