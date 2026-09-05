"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { acceptInviteAction, acceptInviteSignUpAction, type InviteActionResult } from "@/lib/actions/invites";

interface InviteInfo {
  email: string;
  role: string;
}

export function InviteAccept({
  token,
  invite,
  isLoggedIn,
  loggedInEmail,
}: {
  token: string;
  invite: InviteInfo;
  isLoggedIn: boolean;
  loggedInEmail: string | null;
}) {
  const emailMatches = isLoggedIn && loggedInEmail?.toLowerCase() === invite.email.toLowerCase();

  const [acceptState, acceptFormAction, acceptPending] = useActionState<InviteActionResult, FormData>(acceptInviteAction, {});
  const [signUpState, signUpFormAction, signUpPending] = useActionState<InviteActionResult, FormData>(acceptInviteSignUpAction, {});

  if (isLoggedIn && emailMatches) {
    return (
      <form action={acceptFormAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        {acceptState.error ? (
          <p className="text-sm text-destructive" role="alert">
            {acceptState.error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={acceptPending}>
          {acceptPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Accept invite
        </Button>
      </form>
    );
  }

  if (isLoggedIn && !emailMatches) {
    return (
      <div className="space-y-3 text-center text-sm">
        <p className="text-muted-foreground">
          You&apos;re signed in as <strong className="text-foreground">{loggedInEmail}</strong>, but this invite is for{" "}
          <strong className="text-foreground">{invite.email}</strong>.
        </p>
        <Link href={`/login?next=/invite/${token}`} className="font-medium text-primary hover:underline">
          Log out and sign in with the right account
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form action={signUpFormAction} className="space-y-4" noValidate>
        <input type="hidden" name="token" value={token} />
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={invite.email} disabled />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        {signUpState.error ? (
          <p className={cn("text-sm text-destructive")} role="alert">
            {signUpState.error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={signUpPending}>
          {signUpPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create account &amp; join
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have a Brightpath account?{" "}
        <Link href={`/login?next=/invite/${token}`} className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
