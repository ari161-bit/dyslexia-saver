"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { generatePracticeAction } from "@/lib/actions/ai-actions";
import { recordProgressEventAction } from "@/lib/actions/progress";
import type { PracticeableResource } from "@/lib/data/learning";

interface Question {
  question: string;
  answer: string;
  sourceQuote: string;
}

export function PracticeSession({ resources }: { resources: PracticeableResource[] }) {
  const [resourceId, setResourceId] = useState(resources[0]?.id ?? "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [checked, setChecked] = useState<"correct" | "incorrect" | null>(null);
  const [loading, setLoading] = useState(false);

  const resource = resources.find((r) => r.id === resourceId);

  async function start() {
    if (!resource) return;
    setLoading(true);
    setChecked(null);
    setResponse("");
    const result = await generatePracticeAction(resource.extractedText, 5);
    setLoading(false);
    if (result.questions) {
      setQuestions(result.questions);
      setIndex(0);
    }
  }

  function check() {
    const current = questions[index];
    if (!current) return;
    const correct = response.trim().toLowerCase() === current.answer.trim().toLowerCase();
    setChecked(correct ? "correct" : "incorrect");
    if (resource) recordProgressEventAction("practice_completed", resource.id, { correct });
  }

  function next() {
    setChecked(null);
    setResponse("");
    setIndex((i) => i + 1);
  }

  if (resources.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No practice-ready material yet"
        description="Once a resource has been processed, you can generate practice questions grounded in it."
      />
    );
  }

  const current = questions[index];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={resourceId} onValueChange={setResourceId}>
          <SelectTrigger className="h-12 flex-1 rounded-2xl border-2 text-base"><SelectValue placeholder="Choose what to practice" /></SelectTrigger>
          <SelectContent>
            {resources.map((r) => (
              <SelectItem key={r.id} value={r.id} className="text-base">{r.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={start} disabled={loading || !resourceId} className="h-12 rounded-2xl px-6 text-base font-bold">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {questions.length ? "New questions" : "Start!"}
        </Button>
      </div>

      {current ? (
        <div className="space-y-5 rounded-3xl border-2 border-border bg-card p-7">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            Question {index + 1} of {questions.length}
          </p>
          <p className="font-heading text-xl font-bold leading-snug">{current.question}</p>
          <Input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your answer here"
            disabled={checked !== null}
            onKeyDown={(e) => e.key === "Enter" && !checked && check()}
            className="h-12 rounded-2xl border-2 text-base"
          />
          {checked ? (
            <div
              className={`flex items-start gap-3 rounded-2xl p-4 text-base ${
                checked === "correct" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"
              }`}
            >
              {checked === "correct" ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" /> : <XCircle className="mt-0.5 h-6 w-6 shrink-0" />}
              <div>
                <p className="font-bold">{checked === "correct" ? "Nice work! 🎉" : `Not quite — the answer was "${current.answer}"`}</p>
                <p className="mt-1.5 text-sm opacity-80">From what you read: &ldquo;{current.sourceQuote}&rdquo;</p>
              </div>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            {checked ? (
              <Button onClick={next} disabled={index + 1 >= questions.length} variant="outline" className="h-11 rounded-2xl px-5 text-base font-bold">
                <RefreshCw className="h-5 w-5" /> Next question
              </Button>
            ) : (
              <Button onClick={check} disabled={!response.trim()} className="h-11 rounded-2xl px-5 text-base font-bold">Check my answer</Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
