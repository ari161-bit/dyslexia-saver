"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinClassByCodeAction, type ClassActionResult } from "@/lib/actions/classes";

export function JoinClassForm() {
  const [state, formAction, pending] = useActionState<ClassActionResult, FormData>(joinClassByCodeAction, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 space-y-1.5">
        <label htmlFor="code" className="text-sm font-medium">Join a class</label>
        <Input id="code" name="code" placeholder="Enter code from your teacher" className="uppercase" />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Join
      </Button>
      {state.error ? <p className="w-full text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="w-full text-sm text-success">You&apos;ve joined the class.</p> : null}
    </form>
  );
}
