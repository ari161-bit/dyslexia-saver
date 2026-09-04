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
          <SelectTrigger className="flex-1"><SelectValue placeholder="Choose material" /></SelectTrigger>
          <SelectContent>
            {resources.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={start} disabled={loading || !resourceId}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {questions.length ? "Regenerate" : "Start practice"}
        </Button>
      </div>

      {current ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Question {index + 1} of {questions.length}
          </p>
          <p className="font-heading text-lg font-medium">{current.question}</p>
          <Input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Your answer"
            disabled={checked !== null}
            onKeyDown={(e) => e.key === "Enter" && !checked && check()}
          />
          {checked ? (
            <div
              className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
                checked === "correct" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"
              }`}
            >
              {checked === "correct" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <div>
                <p className="font-medium">{checked === "correct" ? "Nice work!" : `Not quite — the answer was "${current.answer}"`}</p>
                <p className="mt-1 text-xs opacity-80">From the source: &ldquo;{current.sourceQuote}&rdquo;</p>
              </div>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            {checked ? (
              <Button onClick={next} disabled={index + 1 >= questions.length} variant="outline">
                <RefreshCw className="h-4 w-4" /> Next question
              </Button>
            ) : (
              <Button onClick={check} disabled={!response.trim()}>Check answer</Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
