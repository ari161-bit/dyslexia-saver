"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateWorksheetAction, type WorksheetResult } from "@/lib/actions/ai-actions";
import { createAssignmentAction, type AssignmentActionResult } from "@/lib/actions/assignments";

type Worksheet = NonNullable<WorksheetResult["worksheet"]>;

// Shared by both the teacher and student worksheet pages — the "save as
// assignment" section only renders when `classes` is passed (teacher-only;
// students don't have a class to assign to, they just use the worksheet
// for their own practice).
export function WorksheetGenerator({ classes }: { classes?: { id: string; name: string }[] }) {
  const [context, setContext] = useState("");
  const [questionCount, setQuestionCount] = useState(6);
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setWorksheet(null);
    const result = await generateWorksheetAction(context, questionCount);
    setLoading(false);
    if (result.error) setError(result.error);
    else if (result.worksheet) setWorksheet(result.worksheet);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-3xl border-2 border-border bg-card p-6">
        <Label htmlFor="context" className="text-base font-bold">
          Paste in the material to build a worksheet from
        </Label>
        <Textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={7}
          placeholder="Paste a passage, your notes, a textbook excerpt — anything with real content. The worksheet will only use what's here, nothing made up."
          className="rounded-2xl border-2 text-base"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor="count" className="text-sm text-muted-foreground">
            Number of questions
          </Label>
          <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
            <SelectTrigger id="count" className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[4, 6, 8, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generate} disabled={loading || context.trim().length < 20} className="ml-auto h-11 rounded-2xl px-6 font-bold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {worksheet ? "Regenerate" : "Make my worksheet"}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      {worksheet ? (
        <div className="space-y-5 rounded-3xl border-2 border-border bg-card p-7">
          <div>
            <p className="font-heading text-xl font-bold">{worksheet.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{worksheet.instructions}</p>
          </div>

          <ol className="space-y-4">
            {worksheet.questions.map((q, i) => (
              <li key={i} className="rounded-2xl bg-secondary/40 p-4">
                <p className="font-medium">
                  {i + 1}. {q.prompt}
                </p>
                {showAnswers ? <p className="mt-2 text-sm font-semibold text-success">Answer: {q.answer}</p> : null}
              </li>
            ))}
          </ol>

          <Button variant="outline" onClick={() => setShowAnswers((v) => !v)} className="rounded-2xl font-semibold">
            {showAnswers ? "Hide answer key" : "Show answer key"}
          </Button>

          {classes ? <SaveAsAssignment worksheet={worksheet} classes={classes} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function SaveAsAssignment({ worksheet, classes }: { worksheet: Worksheet; classes: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<AssignmentActionResult, FormData>(createAssignmentAction, {});
  const [classId, setClassId] = useState(classes.length === 1 ? classes[0].id : "");

  const instructionsText = [
    worksheet.instructions,
    "",
    ...worksheet.questions.map((q, i) => `${i + 1}. ${q.prompt}`),
  ].join("\n");

  return (
    <form action={formAction} className="space-y-3 border-t border-border pt-5">
      <p className="text-base font-bold text-primary">Save this as an assignment</p>
      <input type="hidden" name="title" value={worksheet.title} />
      <input type="hidden" name="instructions" value={instructionsText} />
      <input type="hidden" name="classId" value={classId} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Choose a class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending || !classId} className="h-10 rounded-2xl px-5 font-bold">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Assign to class
        </Button>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
