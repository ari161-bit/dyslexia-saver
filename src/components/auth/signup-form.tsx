"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Loader2, School, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { signUpAction, type ActionResult } from "@/lib/actions/auth";
import type { UserRole } from "@/lib/types/database";

const ROLE_OPTIONS: { role: UserRole; label: string; description: string; icon: typeof User }[] = [
  { role: "student", label: "Student", description: "I want to learn in a way that works for me.", icon: User },
  { role: "parent", label: "Parent", description: "I want to support my child's learning.", icon: Users },
  { role: "teacher", label: "Teacher", description: "I want to adapt my materials for my class.", icon: GraduationCap },
  { role: "school_admin", label: "School", description: "I manage accessibility across my school.", icon: School },
];

export function SignupForm({ schools }: { schools: { id: string; name: string }[] }) {
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(signUpAction, {});

  if (step === "role") {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold">What brings you here?</h1>
          <p className="text-sm text-muted-foreground">We&apos;ll tailor Brightpath to how you&apos;ll use it.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROLE_OPTIONS.map(({ role: r, label, description, icon: Icon }) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setStep("details");
              }}
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="font-heading text-sm font-semibold">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  const selected = ROLE_OPTIONS.find((o) => o.role === role)!;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setStep("role")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold">Create your {selected.label.toLowerCase()} account</h1>
        <p className="text-sm text-muted-foreground">{selected.description}</p>
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="role" value={role ?? ""} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" autoComplete="given-name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" autoComplete="family-name" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        {role === "teacher" ? (
          <div className="space-y-1.5">
            <Label htmlFor="schoolId">Your school</Label>
            <Select name="schoolId" required>
              <SelectTrigger id="schoolId" className="w-full">
                <SelectValue placeholder="Select your school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              A school admin will confirm your account before you can create classes.
            </p>
          </div>
        ) : null}

        {role === "school_admin" ? (
          <div className="space-y-1.5">
            <Label htmlFor="schoolName">School name</Label>
            <Input id="schoolName" name="schoolName" required placeholder="e.g. Maple Ridge Elementary" />
            <p className="text-xs text-muted-foreground">
              New schools are verified before analytics and directories unlock.
            </p>
          </div>
        ) : null}

        {state.error ? (
          <p className={cn("text-sm text-destructive")} role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>
      </form>
    </div>
  );
}
