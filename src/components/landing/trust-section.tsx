"use client";

import { ShieldCheck, FileCheck, UserCheck, Lock } from "lucide-react";
import { Reveal, SectionEyebrow, SectionHeading } from "./reveal";
import { FloatingObject } from "./floating-object";

const ITEMS = [
  { icon: ShieldCheck, title: "NO DIAGNOSIS", copy: "Support learning. Do not clinically diagnose." },
  { icon: FileCheck, title: "SOURCE GROUNDED", copy: "Keep original material visible when wording changes." },
  { icon: UserCheck, title: "HUMAN REVIEW", copy: "Teachers approve classroom adaptations before publishing." },
  { icon: Lock, title: "DATA MINIMIZATION", copy: "Role-based access and only the data the product needs." },
];

export function TrustSection() {
  return (
    <section className="relative bg-white px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <SectionEyebrow>TRUST</SectionEyebrow>
          <SectionHeading>
            AI should support learning,
            <br />
            not take control of it.
          </SectionHeading>
        </Reveal>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item, i) => (
          <FloatingObject key={item.title} icon={item.icon} title={item.title} description={item.copy} delay={i * 0.1} index={i} />
        ))}
      </div>

      <Reveal delay={0.3} className="mx-auto mt-16 max-w-xl text-center">
        <p className="text-lg text-stone-500">
          The goal is independence — <span className="text-stone-800">not an AI shortcut around the learning process.</span>
        </p>
      </Reveal>
    </section>
  );
}
