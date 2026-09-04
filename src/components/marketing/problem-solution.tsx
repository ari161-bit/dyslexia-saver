import { ArrowRight, BookMarked, Ear, PenTool, Puzzle, SpellCheck, Timer } from "lucide-react";

const STRUGGLES = [
  { icon: Timer, label: "Reading speed" },
  { icon: BookMarked, label: "Decoding words" },
  { icon: SpellCheck, label: "Spelling" },
  { icon: PenTool, label: "Writing" },
  { icon: Puzzle, label: "Comprehension" },
  { icon: Ear, label: "Processing instructions" },
];

export function ProblemSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          One classroom. Different learners.
        </h2>
        <p className="mt-4 text-muted-foreground">
          In any classroom, some students can struggle with the format a lesson is delivered
          in — not with the ideas inside it. That struggle has nothing to do with intelligence.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STRUGGLES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-6 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const FLOW = [
  "Teacher uploads lesson",
  "Platform adapts it",
  "Student chooses how to learn",
  "Teacher sees support needs",
  "Parent stays informed",
];

export function SolutionSection() {
  return (
    <section id="solution" className="border-y border-border/60 bg-secondary/30 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            One lesson. Multiple ways to learn.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Instead of rebuilding materials from scratch, teachers upload once — Brightpath
            handles the transformation, and everyone stays connected to the same lesson.
          </p>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">
                {step}
              </div>
              {i < FLOW.length - 1 ? (
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
