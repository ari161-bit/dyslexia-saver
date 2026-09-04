"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction, type ProfileActionResult } from "@/lib/actions/profile";
import { signOutAction } from "@/lib/actions/auth";
import { ROLE_LABEL } from "@/lib/nav-config";
import type { Tables } from "@/lib/types/database";

export function AccountSettingsForm({ profile, email }: { profile: Tables<"profiles">; email: string }) {
  const [state, formAction, pending] = useActionState<ProfileActionResult, FormData>(updateProfileAction, {});

  return (
    <div className="max-w-lg space-y-8">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" defaultValue={profile.first_name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" defaultValue={profile.last_name} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Input value={ROLE_LABEL[profile.role]} disabled />
        </div>
        {profile.student_code ? (
          <div className="space-y-1.5">
            <Label>Your student code</Label>
            <Input value={profile.student_code} disabled className="font-mono tracking-widest" />
            <p className="text-xs text-muted-foreground">Share this with a parent so they can link to your account.</p>
          </div>
        ) : null}
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-success">Saved</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </form>

      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-sm font-medium">Password</p>
        <Button variant="outline" asChild>
          <Link href="/forgot-password">Send password reset email</Link>
        </Button>
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <form action={signOutAction}>
          <Button variant="ghost" type="submit">Sign out</Button>
        </form>
      </div>
    </div>
  );
}
