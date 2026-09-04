import { Baby, GraduationCap, School, User } from "lucide-react";

const AUDIENCES = [
  {
    icon: User,
    role: "For Students",
    title: "Learn in the format that works for you.",
    description:
      "Read, listen, or have it explained differently — the content stays the same, only the way in changes.",
  },
  {
    icon: GraduationCap,
    role: "For Teachers",
    title: "Adapt your teaching without rebuilding every worksheet.",
    description:
      "Upload once. Preview accessible, guided, audio, and practice versions before anything reaches a student.",
  },
  {
    icon: Baby,
    role: "For Parents",
    title: "Know how to support learning at home.",
    description:
      "See what your child is working on and get short, practical ways to help — no jargon, no guesswork.",
  },
  {
    icon: School,
    role: "For Schools",
    title: "Build accessibility into the learning environment.",
    description:
      "Give every classroom the same adaptive tools, with oversight across students, teachers, and resources.",
  },
];

export function AudiencesSection() {
  return (
    <section id="audiences" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {AUDIENCES.map(({ icon: Icon, role, title, description }) => (
          <div
            key={role}
            className="rounded-3xl border border-border/70 bg-card p-6 transition-shadow hover:shadow-md sm:p-8"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
              {role}
            </p>
            <h3 className="mt-2 font-heading text-xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
