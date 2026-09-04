import { BarChart3, Link2, ListChecks, Sparkles, Upload, Users } from "lucide-react";

const STEPS = [
  { icon: Upload, title: "Upload", description: "Teachers upload a worksheet, lesson, or photographed page." },
  { icon: Sparkles, title: "Adapt", description: "Brightpath structures it into accessible, audio, and simplified formats." },
  { icon: ListChecks, title: "Learn", description: "Students choose the format that helps them understand it best." },
  { icon: Users, title: "Practice", description: "Grounded practice questions reinforce what was just learned." },
  { icon: Link2, title: "Connect", description: "Teachers and parents stay in sync on progress and support." },
  { icon: BarChart3, title: "Progress", description: "Everyone sees encouraging, useful signals — never a diagnosis." },
];

export function HowItWorks() {
  return (
    <section id="schools" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          How Brightpath works
        </h2>
        <p className="mt-4 text-muted-foreground">
          Six steps connect every uploaded lesson to every learner who needs it, in the format
          that works for them.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <div key={title} className="relative rounded-2xl border border-border/70 bg-card p-6">
            <span className="absolute right-5 top-5 font-heading text-3xl font-semibold text-border">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
