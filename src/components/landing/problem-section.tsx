"use client";

import { motion } from "framer-motion";
import { BookOpen, PenLine, Lightbulb, Users } from "lucide-react";
import { Reveal, SectionHeading } from "./reveal";

const AREAS = [
  { icon: BookOpen, title: "READ", copy: "Dense text can make decoding the first barrier." },
  { icon: PenLine, title: "WRITE", copy: "Spelling and transcription can consume attention." },
  { icon: Lightbulb, title: "UNDERSTAND", copy: "The same idea may need another explanation." },
  { icon: Users, title: "SUPPORT", copy: "Adults need a shared view of what helps." },
];

export function ProblemSection() {
  return (
    <section id="problem" className="relative bg-white px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-5xl text-center">
        <Reveal>
          <SectionHeading>
            The barrier is often
            <br />
            the format, not the learner.
          </SectionHeading>
        </Reveal>
      </div>

      <div className="relative mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-px overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-200 sm:grid-cols-2">
        {AREAS.map((area, i) => (
          <motion.div
            key={area.title}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-20% 0px" }}
            transition={{ duration: 0.8, delay: i * 0.15 }}
            className="group relative bg-white p-10 sm:p-12"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.08),transparent_60%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-600">
              <area.icon className="h-5 w-5" />
            </span>
            <p className="mt-6 font-heading text-2xl font-semibold tracking-tight text-stone-900">{area.title}</p>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-stone-500">{area.copy}</p>
          </motion.div>
        ))}
      </div>

      <Reveal delay={0.2} className="mx-auto mt-20 max-w-2xl text-center">
        <p className="font-heading text-2xl font-medium text-stone-800 sm:text-3xl">
          Change the learning experience.
          <br />
          <span className="text-orange-600">Don&apos;t label the learner.</span>
        </p>
      </Reveal>
    </section>
  );
}
