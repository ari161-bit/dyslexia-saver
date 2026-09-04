import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 lg:py-12">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-heading text-lg font-semibold">Brightpath</span>
        </Link>
        <div className="mx-auto w-full max-w-sm py-10">{children}</div>
        <p className="text-center text-xs text-muted-foreground lg:text-left">
          © {new Date().getFullYear()} Brightpath. Built for accessible learning.
        </p>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-accent via-secondary to-background lg:block">
        <div className="flex h-full flex-col justify-center gap-6 px-16">
          <p className="font-heading text-3xl font-semibold leading-snug text-accent-foreground">
            Learning should adapt to the learner.
          </p>
          <p className="max-w-md text-accent-foreground/80">
            One lesson, understood in whatever way makes it click — reading, listening,
            simplified, or broken down step by step.
          </p>
          <div className="mt-4 flex -space-x-3">
            {["S", "T", "P", "A"].map((l) => (
              <span
                key={l}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-background bg-card font-heading text-sm font-semibold text-foreground shadow-sm"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
