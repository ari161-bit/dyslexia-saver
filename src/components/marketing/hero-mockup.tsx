"use client";

import { BookOpen, CheckCircle2, FileText, Pause, Sparkles } from "lucide-react";

const LINES = [
  { text: "Plants make their own food using sunlight, water, and air.", active: false },
  { text: "This process is called photosynthesis.", active: true },
  { text: "It happens mostly in the leaves, inside tiny green parts called chloroplasts.", active: false },
];

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/10 blur-2xl" aria-hidden />

      <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-xl shadow-primary/5 sm:p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">Photosynthesis</p>
              <p className="text-xs text-muted-foreground">Grade 7 · Science</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
            <CheckCircle2 className="h-3 w-3" /> Adapted
          </span>
        </div>

        <div className="space-y-3 py-4 font-legible text-[15px] leading-loose">
          {LINES.map((line, i) => (
            <p
              key={i}
              className={
                line.active
                  ? "rounded-lg bg-accent px-2 py-1 text-accent-foreground animate-pulse"
                  : "px-2 text-foreground/80"
              }
            >
              {line.text}
            </p>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-3 py-2.5">
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden>
            <Pause className="h-4 w-4" />
          </button>
          <div className="flex flex-1 items-end gap-0.5" aria-hidden>
            {[6, 12, 8, 16, 10, 14, 7, 11, 9, 13, 6, 10].map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-primary/60"
                style={{ height: `${h}px`, animation: `pulse 1.4s ease-in-out ${i * 0.08}s infinite` }}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground">1.0x</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Ask the tutor:</span> what makes this
              a &quot;process&quot;?
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5">
            <BookOpen className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Assignment:</span> due Friday
            </p>
          </div>
        </div>
      </div>

      <div className="absolute -right-4 -top-4 flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2 shadow-lg sm:-right-8">
        <svg width="34" height="34" viewBox="0 0 36 36" className="shrink-0" aria-hidden>
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--muted)" strokeWidth="4" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="4"
            strokeDasharray="94.2"
            strokeDashoffset="26"
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <div className="leading-tight">
          <p className="text-xs font-semibold">72%</p>
          <p className="text-[10px] text-muted-foreground">this week</p>
        </div>
      </div>
    </div>
  );
}
