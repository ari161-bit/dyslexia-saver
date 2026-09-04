"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadResourceAction, type UploadResult } from "@/lib/actions/resources";

const PROCESSING_MESSAGES = [
  "Reading your document...",
  "Structuring your content...",
  "Making it easier to work with...",
];

export function UploadDropzone({ destination }: { destination: "student" | "teacher" }) {
  const [state, formAction, pending] = useActionState<UploadResult, FormData>(uploadResourceAction, {});
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pending) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, PROCESSING_MESSAGES.length - 1));
    }, 1400);
    return () => clearInterval(interval);
  }, [pending]);

  if (pending) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-heading font-medium">{PROCESSING_MESSAGES[messageIndex]}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          This usually takes just a few seconds.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="destination" value={destination} />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file && inputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            inputRef.current.files = dt.files;
            setFileName(file.name);
          }
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragActive ? "border-primary bg-accent/50" : "border-border hover:border-primary/50 hover:bg-accent/20"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        {fileName ? (
          <>
            <FileText className="h-8 w-8 text-primary" />
            <p className="font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">Click to choose a different file</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Drop a file here, or click to browse</p>
            <p className="text-xs text-muted-foreground">PDF, Word, image, or text — up to 25MB</p>
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title (optional)</Label>
        <Input id="title" name="title" placeholder="e.g. Photosynthesis worksheet" />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={!fileName}>
        Upload and process
      </Button>
    </form>
  );
}
