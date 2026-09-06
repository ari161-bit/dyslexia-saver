import { Reveal } from "./reveal";

const WORDS = [
  { role: "STUDENTS", verb: "learn" },
  { role: "TEACHERS", verb: "adapt" },
  { role: "PARENTS", verb: "understand" },
  { role: "SCHOOLS", verb: "coordinate" },
];

export function VisionSection() {
  return (
    <section className="relative overflow-hidden bg-stone-50 px-6 py-32 sm:py-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(249,115,22,0.08),transparent)]" />

      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="font-heading text-4xl font-semibold leading-[1.15] tracking-tight text-stone-900 sm:text-5xl">
          One learner should not have to fit
          <br />
          one learning format.
        </p>
      </Reveal>

      <div className="mx-auto mt-24 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-4">
        {WORDS.map((w, i) => (
          <Reveal key={w.role} delay={i * 0.1} className="text-center">
            <p className="font-heading text-lg font-semibold tracking-wide text-stone-800 sm:text-xl">{w.role}</p>
            <p className="mt-1 text-sm italic text-orange-600">{w.verb}</p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.3} className="mx-auto mt-28 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-5 font-heading text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          <span>ONE LEARNER</span>
          <span className="text-orange-500">≠</span>
          <span>ONE FORMAT</span>
        </div>
      </Reveal>

      <Reveal delay={0.4} className="mx-auto mt-20 max-w-xl text-center">
        <p className="text-lg leading-relaxed text-stone-500">
          The opportunity is bigger than a reading tool.
          <br />
          <span className="text-stone-800">It is shared learning infrastructure.</span>
        </p>
      </Reveal>
    </section>
  );
}
