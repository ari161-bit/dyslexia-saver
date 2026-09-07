"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAssignmentAction, type AssignmentActionResult } from "@/lib/actions/assignments";

export function CreateAssignmentForm({
  classes,
  defaultClassId,
  resourceId,
  resourceTitle,
}: {
  classes: { id: string; name: string }[];
  defaultClassId?: string;
  resourceId?: string;
  resourceTitle?: string;
}) {
  const [state, formAction, pending] = useActionState<AssignmentActionResult, FormData>(createAssignmentAction, {});
  // A single-option Select can look identical whether it's open or already
  // selected (Radix positions the lone item right over the trigger), which
  // has tricked real clicks into "selecting" nothing. Pre-selecting the
  // only class removes the ambiguity entirely for the common one-class case.
  const [classId, setClassId] = useState(defaultClassId ?? (classes.length === 1 ? classes[0].id : ""));

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {resourceId ? <input type="hidden" name="resourceId" value={resourceId} /> : null}
      {resourceTitle ? (
        <p className="rounded-xl bg-accent/50 px-3 py-2 text-sm text-accent-foreground">
          Attaching material: <span className="font-medium">{resourceTitle}</span>
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="e.g. Photosynthesis reading check" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="classId">Class</Label>
        {/* Radix's native-select bubble sync isn't reliable when the
            dropdown has few/one items (a press-drag-release can select
            without ever updating the hidden select), so this form tracks
            the value itself and submits it via a real hidden input instead
            of relying on Select's `name` prop. */}
        <input type="hidden" name="classId" value={classId} />
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger id="classId" className="w-full"><SelectValue placeholder="Choose a class" /></SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" placeholder="Science" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} placeholder="A short overview students will see first" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea id="instructions" name="instructions" rows={4} placeholder="What should students do?" />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Create assignment
      </Button>
    </form>
  );
}
