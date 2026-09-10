"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStudentAccountAction, type CreateStudentResult } from "@/lib/actions/students";

interface ClassOption {
  id: string;
  name: string;
}

export function CreateStudentDialog({ classes }: { classes: ClassOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CreateStudentResult, FormData>(createStudentAccountAction, {});
  const [classId, setClassId] = useState("");
  const [copied, setCopied] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setCopied(false);
  }

  function copyCredentials() {
    if (!state.email || !state.password) return;
    navigator.clipboard.writeText(`Email: ${state.email}\nPassword: ${state.password}`);
    setCopied(true);
    toast.success("Copied to clipboard");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" /> Create student account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a student account</DialogTitle>
        </DialogHeader>

        {state.success ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Account created. Share these with the student — the password won&apos;t be shown again.</p>
            <div className="space-y-1 rounded-xl border border-border/70 bg-muted/40 p-3 font-mono text-sm">
              <p>Email: {state.email}</p>
              <p>Password: {state.password}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyCredentials}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy
              </Button>
              <Button className="flex-1" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="classId" value={classId} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="text" placeholder="Leave blank to auto-generate" />
              <p className="text-xs text-muted-foreground">At least 8 characters, or leave blank and we&apos;ll generate one.</p>
            </div>
            {classes.length > 0 ? (
              <div className="space-y-1.5">
                <Label htmlFor="classId">Add to class (optional)</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger id="classId" className="w-full">
                    <SelectValue placeholder="Don't add to a class yet" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create account
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
