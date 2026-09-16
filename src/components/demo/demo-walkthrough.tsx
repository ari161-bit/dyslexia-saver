"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Ear,
  Eye,
  FileText,
  GraduationCap,
  Home,
  Loader2,
  Pause,
  Play,
  School,
  Sparkles,
  Users,
  Wand2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DEMO_EXPLAIN_SIMPLE,
  DEMO_KEY_IDEAS,
  DEMO_LESSON_SUBJECT,
  DEMO_LESSON_TEXT,
  DEMO_LESSON_TITLE,
  DEMO_PRACTICE_QUESTIONS,
  checkDemoAnswer,
} from "@/lib/demo-lesson";

const STEPS = ["Original", "Adapting", "Read", "Listen", "Explain", "Practice", "Progress"] as const;
type Step = (typeof STEPS)[number];

export function DemoWalkthrough() {
  const [stepIndex, setStepIndex] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const step = STEPS[stepIndex];

  function goTo(index: number) {
    setFocusMode(false);
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, index)));
  }

  if (focusMode) {
    return <FocusModeView onExit={() => setFocusMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6]">
      <header className="flex items-center justify-between border-b border-border/70 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Home className="h-4 w-4" /> Brightpath
        </Link>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
          Competition Demo
        </span>
      </header>

      {/* Step indicator — click any step to jump directly, so the presenter stays in control during a live pitch */}
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-1 overflow-x-auto px-4 pt-6 sm:px-6">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => goTo(i)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1.5 whitespace-nowrap px-1 pb-3 text-xs font-semibold transition-colors",
              i === stepIndex ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-2 w-2 rounded-full transition-all",
                i === stepIndex ? "w-6 bg-primary" : i < stepIndex ? "bg-primary/40" : "bg-border",
              )}
            />
            {s}
          </button>
        ))}
      </div>

      <main className="mx-auto max-w-3xl px-4 pb-28 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === "Original" ? <OriginalStep /> : null}
            {step === "Adapting" ? <AdaptingStep /> : null}
            {step === "Read" ? <ReadStep onTryFocus={() => setFocusMode(true)} /> : null}
            {step === "Listen" ? <ListenStep /> : null}
            {step === "Explain" ? <ExplainStep /> : null}
            {step === "Practice" ? <PracticeStep /> : null}
            {step === "Progress" ? <ProgressStep /> : null}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Button variant="ghost" onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <p className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          {stepIndex < STEPS.length - 1 ? (
            <Button onClick={() => goTo(stepIndex + 1)}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild>
              <Link href="/">Exit demo</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-6 pt-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">{description}</p>
    </div>
  );
}

function OriginalStep() {
  return (
    <div>
      <StepHeading
        eyebrow="Original classroom lesson"
        title="This is the same lesson the teacher already has."
        description="A real worksheet, unchanged. Brightpath doesn't replace it — it opens more ways into it."
      />
      <div className="rounded-3xl border-2 border-neutral-300 bg-white p-8 shadow-sm" style={{ fontFamily: "Georgia, serif" }}>
        <div className="mb-4 flex items-center justify-between border-b border-dashed border-neutral-300 pb-4">
          <span className="text-sm font-bold uppercase tracking-wide text-neutral-500">{DEMO_LESSON_SUBJECT} · Grade 7</span>
          <FileText className="h-5 w-5 text-neutral-400" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">{DEMO_LESSON_TITLE}</h2>
        <p className="mt-4 text-base leading-normal text-neutral-800">{DEMO_LESSON_TEXT}</p>
        <div className="mt-6 rounded-xl bg-neutral-50 p-4">
          <p className="font-semibold text-neutral-900">
            Q: What do plants use, besides sunlight, to make their own food?
          </p>
        </div>
      </div>
    </div>
  );
}

function AdaptingStep() {
  const pathways = [
    { label: "Read", icon: BookOpenText },
    { label: "Listen", icon: Ear },
    { label: "Explain", icon: Wand2 },
    { label: "Focus", icon: Eye },
    { label: "Practice", icon: Sparkles },
  ];
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <StepHeading
        eyebrow="Adapted with brightpath"
        title="One lesson becomes five ways in."
        description="Same facts, same learning objective — Brightpath just opens more doors into it."
      />
      <div className="relative flex flex-col items-center gap-6">
        <div className="rounded-2xl border-2 border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 shadow-sm">
          {DEMO_LESSON_TITLE}
        </div>
        <motion.div
          animate={{ scaleY: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="h-10 w-0.5 origin-top bg-primary/40"
        />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {pathways.map(({ label, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.4 }}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-primary/30 bg-primary/5 px-4 py-4"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold text-primary">{label.toUpperCase()}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReadStep({ onTryFocus }: { onTryFocus: () => void }) {
  const [clearer, setClearer] = useState(false);
  const paragraphs = useMemo(() => DEMO_LESSON_TEXT.split(". ").reduce<string[]>((acc, sentence, i, arr) => {
    if (!acc.length) acc.push("");
    acc[acc.length - 1] += sentence + (i < arr.length - 1 ? ". " : "");
    return acc;
  }, [""]), []);

  return (
    <div>
      <StepHeading eyebrow="Pathway: Read" title="Read it clearer." description="Same words. Formatting built for a dyslexic reader." />
      <div className="mb-4 flex items-center justify-between rounded-2xl border-2 border-border bg-white px-5 py-3">
        <span className="text-sm font-semibold">Read clearer</span>
        <Switch checked={clearer} onCheckedChange={setClearer} />
      </div>
      <motion.div
        animate={{
          fontSize: clearer ? 19 : 14,
          lineHeight: clearer ? 1.9 : 1.35,
          letterSpacing: clearer ? "0.03em" : "0em",
        }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "rounded-2xl border-2 p-6 transition-colors duration-500",
          clearer ? "border-primary/30 bg-[#fbf3e3] font-legible text-neutral-900" : "border-border bg-white font-serif text-neutral-800",
        )}
      >
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-3 last:mb-0">
            {p.trim()}
          </p>
        ))}
      </motion.div>
      <button onClick={onTryFocus} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <Eye className="h-3.5 w-3.5" /> Try Focus mode →
      </button>
    </div>
  );
}

function ListenStep() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(1);
  const totalLength = DEMO_LESSON_TEXT.length || 1;

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  function toggle() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(DEMO_LESSON_TEXT);
    utterance.rate = rate;
    utterance.onboundary = (e) => setProgress(Math.min(100, Math.round((e.charIndex / totalLength) * 100)));
    utterance.onend = () => {
      setIsSpeaking(false);
      setProgress(100);
    };
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setProgress(0);
  }

  return (
    <div>
      <StepHeading eyebrow="Pathway: Listen" title="Listen to the same lesson." description="No new content — just a different way to take it in." />
      <div className="rounded-2xl border-2 border-border bg-white p-6">
        <div className="flex items-center gap-3">
          <Button size="icon" className="h-12 w-12 rounded-full" onClick={toggle} aria-label={isSpeaking ? "Pause" : "Play"}>
            {isSpeaking ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <div className="flex-1">
            <Progress value={progress} />
          </div>
          <span className="w-10 text-right text-xs text-muted-foreground">{progress}%</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Speed</span>
          {[0.75, 1, 1.25, 1.5].map((r) => (
            <button
              key={r}
              onClick={() => setRate(r)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                rate === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
              )}
            >
              {r}x
            </button>
          ))}
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transcript</p>
          <p className="text-sm leading-relaxed text-neutral-700">{DEMO_LESSON_TEXT}</p>
        </div>
      </div>
    </div>
  );
}

function ExplainStep() {
  return (
    <div>
      <StepHeading eyebrow="Pathway: Explain" title="Same concept, explained simply." description="The academic idea doesn't change — only how it's said." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-border bg-white p-5">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Original</p>
          <p className="text-sm leading-relaxed text-neutral-800">{DEMO_LESSON_TEXT}</p>
        </div>
        <div className="rounded-2xl border-2 border-primary/30 bg-[#fbf3e3] p-5 font-legible">
          <p className="mb-2 text-sm font-semibold text-primary">Clearer explanation</p>
          <div className="space-y-2 text-base leading-relaxed text-neutral-900">
            {DEMO_EXPLAIN_SIMPLE.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-border/70 bg-muted/40 p-4">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Key ideas</p>
        <p className="text-sm text-foreground/90">{DEMO_KEY_IDEAS.summary}</p>
      </div>
    </div>
  );
}

function PracticeStep() {
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [checked, setChecked] = useState<"correct" | "incorrect" | null>(null);
  const current = DEMO_PRACTICE_QUESTIONS[index];

  function check() {
    if (!current) return;
    setChecked(checkDemoAnswer(response, current.accept) ? "correct" : "incorrect");
  }
  function next() {
    setChecked(null);
    setResponse("");
    setIndex((i) => i + 1);
  }

  if (!current) {
    return (
      <div className="rounded-2xl border-2 border-border bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <p className="mt-3 font-heading text-xl font-bold">Practice complete</p>
        <p className="mt-1 text-sm text-muted-foreground">{DEMO_PRACTICE_QUESTIONS.length} questions, grounded in the exact lesson above.</p>
      </div>
    );
  }

  return (
    <div>
      <StepHeading eyebrow="Pathway: Practice" title="Check understanding, gently." description="Immediate, encouraging feedback — grounded in the lesson text." />
      <div className="rounded-2xl border-2 border-border bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          Question {index + 1} of {DEMO_PRACTICE_QUESTIONS.length}
        </p>
        <p className="mt-2 font-heading text-lg font-bold leading-snug">{current.question}</p>
        <Input
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Type your answer here"
          disabled={checked !== null}
          onKeyDown={(e) => e.key === "Enter" && !checked && check()}
          className="mt-4"
        />
        {checked ? (
          <div className={cn("mt-4 flex items-start gap-3 rounded-xl p-3 text-sm", checked === "correct" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
            {checked === "correct" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" />}
            <div>
              <p className="font-semibold">{checked === "correct" ? "Nice work!" : "Close — here's the answer: Water and air."}</p>
              <p className="mt-1 opacity-80">From the text: &ldquo;{current.sourceQuote}&rdquo;</p>
            </div>
          </div>
        ) : null}
        <div className="mt-4 flex justify-end">
          {checked ? (
            <Button onClick={next}>Next question</Button>
          ) : (
            <Button onClick={check} disabled={!response.trim()}>
              Check my answer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressStep() {
  const roles = [
    { label: "Student", icon: GraduationCap, note: "Chooses the pathway that works for them" },
    { label: "Teacher", icon: Users, note: "Sees which pathways were used, and where support may help" },
    { label: "Parent", icon: Home, note: "Sees what their child completed, in plain language" },
    { label: "School", icon: School, note: "Sees adoption across classrooms" },
  ];
  return (
    <div>
      <StepHeading
        eyebrow="Shared progress"
        title="One lesson connects everyone around it."
        description="Illustrative — showing how the same activity flows to each role, not live data."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map(({ label, icon: Icon, note }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.4 }}
            className="flex items-start gap-3 rounded-2xl border-2 border-border bg-white p-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading font-bold">{label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FocusModeView({ onExit }: { onExit: () => void }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const totalLength = DEMO_LESSON_TEXT.length || 1;

  function toggleSpeak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(DEMO_LESSON_TEXT);
    utterance.onboundary = (e) => setProgress(Math.min(100, Math.round((e.charIndex / totalLength) * 100)));
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  return (
    <div className="min-h-screen bg-[#fbf3e3]">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <Button variant="ghost" onClick={onExit}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <span className="text-xs font-bold uppercase tracking-wide text-primary">Focus mode</span>
      </div>
      <Progress value={progress} className="mx-auto max-w-2xl" />
      <div className="mx-auto max-w-2xl px-6 py-16 font-legible text-2xl leading-[2] text-neutral-900">
        {DEMO_LESSON_TEXT}
      </div>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <Button size="lg" className="h-14 rounded-full px-6 shadow-lg" onClick={toggleSpeak}>
          {isSpeaking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
          {isSpeaking ? "Reading..." : "Read aloud"}
        </Button>
      </div>
    </div>
  );
}
