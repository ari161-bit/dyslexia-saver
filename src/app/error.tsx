"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="font-heading text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-muted-foreground">
        This wasn&apos;t your fault — try again, and if it keeps happening let us know.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
