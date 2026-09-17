"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpenText,
  CheckCircle2,
  Ear,
  Frown,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Loader2,
  Meh,
  Pause,
  Play,
  RefreshCw,
  Smile,
  Sparkles,
  SpellCheck,
  Wand2,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  explainSelectionAction,
  generatePracticeAction,
  getKeyIdeasAction,
  getVocabularyListAction,
  simplifyTextAction,
} from "@/lib/actions/ai-actions";
import { recordProgressEventAction } from "@/lib/actions/progress";
import { fleschReadingEase } from "@/lib/readability";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/types/database";

type TabValue = "read" | "listen" | "simplify" | "ideas" | "vocabulary" | "practice";

interface QAItem {
  question: string;
  accept: string[];
  sourceQuote: string;
}

// A hand-written simplification and a fixed question set for the flagship
// demo lesson (Photosynthesis, Grade 7), grounded in the exact seeded
// passage, so the pitch's core moment never depends on a live AI call
// working mid-demo. Everything still runs for real on any other resource
// via the live AI actions below.
const PHOTOSYNTHESIS_SIMPLIFIED = [
  "Plants make their own food. They need sunlight, water, and air to do this. This is called photosynthesis.",
  "It happens inside the leaves, in tiny green parts called chloroplasts.",
  "Chlorophyll is the green color in the leaf. It catches light from the sun.",
  "The plant mixes that light energy with water and air. This makes sugar (glucose) and oxygen.",
  "The plant lets oxygen out into the air. Living things need that oxygen to breathe.",
  "Without photosynthesis, most living things would have no food.",
];

const PHOTOSYNTHESIS_KEY_IDEAS = {
  summary:
    "Plants make their own food through photosynthesis, using sunlight, water, and carbon dioxide to produce glucose and oxygen.",
  keyPoints: [
    "Photosynthesis happens mainly inside the leaves.",
    "Chloroplasts are the tiny green parts where it happens.",
    "Chlorophyll captures light energy from the sun.",
    "The plant combines that energy with water and carbon dioxide.",
    "The process makes glucose (the plant's food) and oxygen.",
    "Oxygen is released into the air. Other living things need it to breathe.",
  ],
};

const PHOTOSYNTHESIS_VOCAB = [
  { term: "Photosynthesis", definition: "The process plants use to make their own food from sunlight.", example: "This process is called photosynthesis." },
  { term: "Chlorophyll", definition: "The green substance in leaves that captures light energy.", example: "Chlorophyll, the green pigment in chloroplasts, captures light energy." },
  { term: "Chloroplast", definition: "A tiny green part inside a plant cell where photosynthesis happens.", example: "It happens mostly in the leaves, inside tiny green parts called chloroplasts." },
  { term: "Glucose", definition: "A type of sugar that plants make and use for energy.", example: "...to produce glucose and oxygen." },
];

const PHOTOSYNTHESIS_QA: QAItem[] = [
  {
    question: "What do plants use, besides sunlight, to make their own food?",
    accept: ["water", "air", "carbon dioxide", "co2"],
    sourceQuote: "combines that energy with water from the roots and carbon dioxide from the air",
  },
  {
    question: "What is the name of the green pigment that captures light energy?",
    accept: ["chlorophyll"],
    sourceQuote: "Chlorophyll, the green pigment in chloroplasts, captures light energy.",
  },
  {
    question: "What two things does photosynthesis produce?",
    accept: ["glucose", "oxygen"],
    sourceQuote: "produce glucose and oxygen",
  },
  {
    question: "What is the process called when a plant makes its own food?",
    accept: ["photosynthesis"],
    sourceQuote: "This process is called photosynthesis.",
  },
];

function isDemoLesson(title: string) {
  return title.toLowerCase().includes("photosynthesis");
}

function checkAnswer(response: string, accept: string[]) {
  const normalized = response.trim().toLowerCase();
  if (!normalized) return false;
  return accept.some((keyword) => normalized.includes(keyword));
}

const TAB_META: { value: TabValue; label: string; icon: typeof BookOpenText }[] = [
  { value: "read", label: "Read clearer", icon: BookOpenText },
  { value: "listen", label: "Listen", icon: Ear },
  { value: "simplify", label: "Simplify", icon: Wand2 },
  { value: "ideas", label: "Key ideas", icon: Lightbulb },
  { value: "vocabulary", label: "Vocabulary", icon: SpellCheck },
  { value: "practice", label: "Practise", icon: Sparkles },
];

export function LessonPathways({
  resource,
  fullText,
  initialTab = "read",
}: {
  resource: Tables<"bp_resources">;
  fullText: string;
  initialTab?: string;
}) {
  const isDemo = isDemoLesson(resource.title);
  const [tab, setTab] = useState<TabValue>((TAB_META.find((t) => t.value === initialTab)?.value ?? "read") as TabValue);
  const [clearer, setClearer] = useState(false);
  const paragraphs = useMemo(
    () => (fullText.trim() ? fullText.split(/\n+/).filter(Boolean) : ["This resource is still processing."]),
    [fullText],
  );

  return (
    <div className="relative mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/student/learning" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Badge variant="secondary" className="font-normal">
          {resource.subject ?? "General"}
        </Badge>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">{resource.title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            One lesson, six ways in: read it clearer, listen, simplify, get the key ideas, check vocabulary, or practise.
          </p>
        </div>
        <Link href={`/read/${resource.id}`} className="text-xs font-medium text-primary hover:underline">
          Open full reader &amp; settings →
        </Link>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          {TAB_META.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="read" className="pt-5">
          <ReadClearerTab paragraphs={paragraphs} clearer={clearer} setClearer={setClearer} />
        </TabsContent>
        <TabsContent value="listen" className="pt-5">
          <ListenTab fullText={fullText} />
        </TabsContent>
        <TabsContent value="simplify" className="pt-5">
          <SimplifyTab paragraphs={paragraphs} fullText={fullText} isDemo={isDemo} />
        </TabsContent>
        <TabsContent value="ideas" className="pt-5">
          <KeyIdeasTab fullText={fullText} isDemo={isDemo} />
        </TabsContent>
        <TabsContent value="vocabulary" className="pt-5">
          <VocabularyTab fullText={fullText} isDemo={isDemo} />
        </TabsContent>
        <TabsContent value="practice" className="pt-5">
          <PracticeTab resourceId={resource.id} fullText={fullText} isDemo={isDemo} />
        </TabsContent>
      </Tabs>

      <HelpMeButton fullText={fullText} onGoTo={(t) => setTab(t)} onWantsClearer={() => setClearer(true)} />
    </div>
  );
}

function ReadClearerTab({
  paragraphs,
  clearer,
  setClearer,
}: {
  paragraphs: string[];
  clearer: boolean;
  setClearer: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-3 py-3">
          <div>
            <Label htmlFor="clearer-toggle" className="text-base font-semibold">
              Read clearer
            </Label>
            <p className="text-xs text-muted-foreground">
              {clearer ? "Atkinson Hyperlegible · larger text · roomy spacing · cream background" : "Standard textbook formatting"}
            </p>
          </div>
          <Switch id="clearer-toggle" checked={clearer} onCheckedChange={setClearer} />
        </CardContent>
      </Card>

      <motion.div
        animate={{
          fontSize: clearer ? 19 : 14,
          lineHeight: clearer ? 1.9 : 1.35,
          letterSpacing: clearer ? "0.03em" : "0em",
          wordSpacing: clearer ? "0.12em" : "0em",
        }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "rounded-2xl border-2 p-6 transition-colors duration-500",
          clearer ? "border-primary/30 bg-[#fbf3e3] font-legible text-neutral-900" : "border-border bg-white font-serif text-neutral-800",
        )}
      >
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-4 last:mb-0">
            {p}
          </p>
        ))}
      </motion.div>
    </div>
  );
}

function ListenTab({ fullText }: { fullText: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);
  const totalLength = fullText.length || 1;

  const sentences = useMemo(() => {
    const matches = fullText.match(/[^.!?]+[.!?]*\s*/g);
    return matches && matches.length ? matches : [fullText];
  }, [fullText]);

  const sentenceStarts = useMemo(
    () => sentences.map((_, i) => sentences.slice(0, i).join("").length),
    [sentences],
  );

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
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.onboundary = (e) => {
      setProgress(Math.min(100, Math.round((e.charIndex / totalLength) * 100)));
      let idx = 0;
      for (let i = sentenceStarts.length - 1; i >= 0; i--) {
        if (e.charIndex >= sentenceStarts[i]) {
          idx = i;
          break;
        }
      }
      setActiveSentenceIndex(idx);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setProgress(100);
    };
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setProgress(0);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-3">
            <Button size="icon" className="h-11 w-11 rounded-full" onClick={toggle} aria-label={isSpeaking ? "Pause" : "Play"}>
              {isSpeaking ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <div className="flex-1">
              <Progress value={progress} />
            </div>
            <span className="w-10 text-right text-xs text-muted-foreground">{progress}%</span>
          </div>
          {typeof window !== "undefined" && !window.speechSynthesis ? (
            <p className="text-xs text-destructive">Text-to-speech isn&apos;t supported in this browser.</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="rounded-2xl border-2 border-border bg-white p-6 font-legible text-base leading-relaxed text-neutral-800">
        {sentences.map((s, i) => (
          <span key={i} className={cn("transition-colors duration-200", i === activeSentenceIndex && isSpeaking && "rounded bg-accent px-0.5 text-accent-foreground")}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function SimplifyTab({ paragraphs, fullText, isDemo }: { paragraphs: string[]; fullText: string; isDemo: boolean }) {
  const [simplified, setSimplified] = useState<string[] | null>(isDemo ? PHOTOSYNTHESIS_SIMPLIFIED : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAI() {
    setLoading(true);
    setError(null);
    const result = await simplifyTextAction(fullText);
    setLoading(false);
    if (result.error) setError(result.error);
    else setSimplified(result.paragraphs ?? []);
  }

  const originalScore = useMemo(() => fleschReadingEase(fullText), [fullText]);
  const simplifiedScore = useMemo(() => fleschReadingEase((simplified ?? []).join(" ")), [simplified]);

  return (
    <div className="space-y-4">
      {!simplified ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Wand2 className="h-8 w-8 text-primary" />
            <p className="font-heading text-lg font-semibold">Rewrite this passage for easier reading</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Same facts, shorter sentences, simpler words. Generated live from the lesson text.
            </p>
            <Button onClick={runAI} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Simplify this lesson
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-2xl border-2 border-border bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">Original</p>
                <ReadingEaseBadge {...originalScore} />
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-neutral-800">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <div className="space-y-2 rounded-2xl border-2 border-primary/30 bg-[#fbf3e3] p-5 font-legible">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">Simplified</p>
                <ReadingEaseBadge {...simplifiedScore} highlight />
              </div>
              <div className="space-y-3 text-base leading-relaxed text-neutral-900">
                {simplified.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={runAI} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate with AI
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </>
      )}
    </div>
  );
}

function ReadingEaseBadge({ score, grade, highlight }: { score: number; grade: string; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        highlight ? "border-success/40 bg-success/15 text-success" : "border-border bg-muted text-muted-foreground",
      )}
      title="Flesch Reading Ease: higher is easier to read"
    >
      {score} · {grade}
    </span>
  );
}

function KeyIdeasTab({ fullText, isDemo }: { fullText: string; isDemo: boolean }) {
  const [data, setData] = useState<{ summary: string; keyPoints: string[] } | null>(isDemo ? PHOTOSYNTHESIS_KEY_IDEAS : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    const result = await getKeyIdeasAction(fullText);
    setLoading(false);
    if (result.error) setError(result.error);
    else setData({ summary: result.summary ?? "", keyPoints: result.keyPoints ?? [] });
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <Lightbulb className="h-8 w-8 text-primary" />
          <p className="font-heading text-lg font-semibold">Pull out the key ideas</p>
          <p className="max-w-sm text-sm text-muted-foreground">A short summary and the main points, grounded in this exact lesson.</p>
          <Button onClick={run} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Show key ideas
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border-2 border-border bg-card p-6">
      <p className="text-base leading-relaxed">{data.summary}</p>
      <ul className="space-y-2">
        {data.keyPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VocabularyTab({ fullText, isDemo }: { fullText: string; isDemo: boolean }) {
  const [entries, setEntries] = useState<{ term: string; definition: string; example: string }[] | null>(
    isDemo ? PHOTOSYNTHESIS_VOCAB : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    const result = await getVocabularyListAction(fullText);
    setLoading(false);
    if (result.error) setError(result.error);
    else setEntries(result.entries ?? []);
  }

  if (!entries) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <SpellCheck className="h-8 w-8 text-primary" />
          <p className="font-heading text-lg font-semibold">Check tricky vocabulary</p>
          <p className="max-w-sm text-sm text-muted-foreground">Plain-language definitions for words in this lesson that might trip you up.</p>
          <Button onClick={run} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Show vocabulary
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((e, i) => (
        <div key={i} className="rounded-2xl border-2 border-border bg-card p-5">
          <p className="font-heading text-base font-bold text-primary">{e.term}</p>
          <p className="mt-1 text-sm">{e.definition}</p>
          {e.example ? <p className="mt-2 text-sm italic text-muted-foreground">&ldquo;{e.example}&rdquo;</p> : null}
        </div>
      ))}
    </div>
  );
}

function PracticeTab({ resourceId, fullText, isDemo }: { resourceId: string; fullText: string; isDemo: boolean }) {
  const [aiQuestions, setAiQuestions] = useState<{ question: string; answer: string; sourceQuote: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [checked, setChecked] = useState<"correct" | "incorrect" | null>(null);

  const items: { question: string; accept: string[]; sourceQuote: string }[] = isDemo
    ? PHOTOSYNTHESIS_QA
    : (aiQuestions ?? []).map((q) => ({ question: q.question, accept: [q.answer.toLowerCase()], sourceQuote: q.sourceQuote }));

  async function generate() {
    setLoading(true);
    const result = await generatePracticeAction(fullText, 4);
    setLoading(false);
    setIndex(0);
    setChecked(null);
    setResponse("");
    if (result.questions) setAiQuestions(result.questions);
  }

  const current = items[index];

  function check() {
    if (!current) return;
    const correct = checkAnswer(response, current.accept);
    setChecked(correct ? "correct" : "incorrect");
    recordProgressEventAction("practice_completed", resourceId, { correct });
  }

  function next() {
    setChecked(null);
    setResponse("");
    setIndex((i) => i + 1);
  }

  if (!isDemo && !aiQuestions) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <Sparkles className="h-8 w-8 text-primary" />
          <p className="font-heading text-lg font-semibold">Practise what you just read</p>
          <p className="max-w-sm text-sm text-muted-foreground">Quick recall questions generated from this exact lesson.</p>
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Start
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!current) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="font-heading text-lg font-semibold">You finished the set!</p>
            <Button
              onClick={() => {
                setIndex(0);
                setChecked(null);
                setResponse("");
                if (!isDemo) generate();
              }}
            >
              <RefreshCw className="h-4 w-4" /> Practice again
            </Button>
          </CardContent>
        </Card>
        <ConfidenceCheckIn resourceId={resourceId} />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border-2 border-border bg-card p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">
        Question {index + 1} of {items.length}
      </p>
      <p className="font-heading text-lg font-bold leading-snug">{current.question}</p>
      <Input
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your answer here"
        disabled={checked !== null}
        onKeyDown={(e) => e.key === "Enter" && !checked && check()}
      />
      {checked ? (
        <div className={cn("flex items-start gap-3 rounded-xl p-3 text-sm", checked === "correct" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
          {checked === "correct" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" />}
          <div>
            <p className="font-semibold">{checked === "correct" ? "Nice work! 🎉" : "Not quite, check the passage again."}</p>
            <p className="mt-1 opacity-80">From the text: &ldquo;{current.sourceQuote}&rdquo;</p>
          </div>
        </div>
      ) : null}
      <div className="flex justify-end">
        {checked ? (
          <Button onClick={next}>
            <RefreshCw className="h-4 w-4" /> Next question
          </Button>
        ) : (
          <Button onClick={check} disabled={!response.trim()}>
            Check my answer
          </Button>
        )}
      </div>
    </div>
  );
}

const CONFIDENCE_LEVELS = [
  { level: "understood", label: "I understood this", icon: Smile },
  { level: "needed_help", label: "I needed some help", icon: Meh },
  { level: "difficult", label: "I found this difficult", icon: Frown },
] as const;

// Not another grade, a direct signal of how the lesson FELT, separate from
// whether the answers were right. A student can get a question wrong but
// still say "I understood this" (a slip, not a comprehension gap), or get
// it right while saying "I needed help" (guessed, or it took real effort).
// That distinction is what teachers actually need to tell "wrong answer"
// apart from "the format got in the way."
function ConfidenceCheckIn({ resourceId }: { resourceId: string }) {
  const [picked, setPicked] = useState<string | null>(null);

  function pick(level: string) {
    setPicked(level);
    recordProgressEventAction("confidence_reflection", resourceId, { level });
  }

  if (picked) {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        Thanks, that helps your teacher understand how this lesson felt, not just the score.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5">
      <p className="text-sm font-semibold text-muted-foreground">How did that feel?</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {CONFIDENCE_LEVELS.map(({ level, label, icon: Icon }) => (
          <button
            key={level}
            onClick={() => pick(level)}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-border/70 px-3 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent/30"
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const HELP_OPTIONS: { label: string; action: "simplify" | "read" | "vocabulary" | "practice" | "example" }[] = [
  { label: "I can't understand this", action: "simplify" },
  { label: "I can't read this easily", action: "read" },
  { label: "I don't know this word", action: "vocabulary" },
  { label: "I don't understand the question", action: "practice" },
  { label: "I need an example", action: "example" },
];

function HelpMeButton({
  fullText,
  onGoTo,
  onWantsClearer,
}: {
  fullText: string;
  onGoTo: (tab: TabValue) => void;
  onWantsClearer: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [example, setExample] = useState<string | null>(null);
  const [exampleLoading, setExampleLoading] = useState(false);

  async function handle(action: (typeof HELP_OPTIONS)[number]["action"]) {
    setOpen(false);
    if (action === "simplify") onGoTo("simplify");
    else if (action === "vocabulary") onGoTo("vocabulary");
    else if (action === "practice") onGoTo("practice");
    else if (action === "read") {
      onGoTo("read");
      onWantsClearer();
    } else if (action === "example") {
      setExampleLoading(true);
      setExample(null);
      const result = await explainSelectionAction(fullText, "Give one simple, relatable example that helps explain this lesson.");
      setExampleLoading(false);
      setExample(result.explanation ?? result.error ?? "Couldn't find an example right now.");
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-30">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button size="lg" className="h-14 rounded-full px-5 shadow-lg">
              <HelpCircle className="h-5 w-5" /> Help me
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-2">
            <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">I&apos;m stuck…</p>
            <div className="space-y-1">
              {HELP_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handle(opt.action)}
                  className="block w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <AnimatePresence>
        {exampleLoading || example ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-24 left-1/2 z-30 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> Here&apos;s an example
              </p>
              <button onClick={() => setExample(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {exampleLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking of one...
              </p>
            ) : (
              <p className="whitespace-pre-line text-sm">{example}</p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
