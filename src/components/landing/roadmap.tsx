import { CheckCircle2, Home, Building2, Handshake } from "lucide-react";
import { Reveal, SectionEyebrow, SectionHeading } from "./reveal";

const MVP = [
  "Accessible reader + text to speech",
  "Teacher upload + adaptation + approval",
  "AI explanation + vocabulary + practice",
  "Parent weekly view",
];

const ADOPTION = [
  { icon: Home, title: "FAMILIES", copy: "Optional advanced home support." },
  { icon: Building2, title: "SCHOOLS", copy: "Classroom or school licensing." },
  { icon: Handshake, title: "PARTNERS", copy: "Education organizations." },
];

export function Roadmap() {
  return (
    <section className="relative bg-white px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <SectionEyebrow>MVP</SectionEyebrow>
          <SectionHeading>
            Start small.
            <br />
            Prove the loop.
            <br />
            Then scale.
          </SectionHeading>
        </Reveal>
      </div>

      <Reveal delay={0.15} className="mx-auto mt-16 max-w-lg">
        <div className="space-y-3 rounded-[1.75rem] border border-stone-200 bg-white p-8 shadow-sm">
          {MVP.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <p className="text-[15px] text-stone-700">{item}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {ADOPTION.map((item, i) => (
          <Reveal key={item.title} delay={0.1 * i}>
            <div className="h-full rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center transition-colors duration-300 hover:border-orange-300">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600">
                <item.icon className="h-4 w-4" />
              </span>
              <p className="mt-4 font-heading text-sm font-semibold tracking-wide text-stone-900">{item.title}</p>
              <p className="mt-1.5 text-[13px] text-stone-500">{item.copy}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
