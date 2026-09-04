"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSchoolNameAction, type SchoolNameActionResult } from "@/lib/actions/school-settings";

export function SchoolNameForm({ schoolId, currentName }: { schoolId: string; currentName: string }) {
  const [state, formAction, pending] = useActionState<SchoolNameActionResult, FormData>(updateSchoolNameAction, {});

  return (
    <form action={formAction} className="max-w-sm space-y-3">
      <input type="hidden" name="schoolId" value={schoolId} />
      <div className="space-y-1.5">
        <Label htmlFor="name">School name</Label>
        <Input id="name" name="name" defaultValue={currentName} required />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">Saved</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save
      </Button>
    </form>
  );
}
