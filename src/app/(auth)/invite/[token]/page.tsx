import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { InviteAccept } from "@/components/auth/invite-accept";

export const metadata: Metadata = { title: "You're invited" };

const ROLE_LABEL: Record<string, string> = { teacher: "a teacher", school_admin: "an admin", student: "a student" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invites, error } = await supabase.rpc("bp_get_invite_by_token", { p_token: token });
  const invite = invites?.[0];

  if (error || !invite) {
    return (
      <div className="space-y-4 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
        <h1 className="font-heading text-xl font-semibold">Invite not found</h1>
        <p className="text-sm text-muted-foreground">This invite link doesn&apos;t exist, or has already been used.</p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  if (invite.status !== "pending") {
    const copy =
      invite.status === "accepted"
        ? "This invite has already been accepted."
        : invite.status === "expired"
          ? "This invite has expired — ask whoever sent it to send a new one."
          : "This invite was revoked.";
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-xl font-semibold">Invite no longer active</h1>
        <p className="text-sm text-muted-foreground">{copy}</p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="font-heading text-2xl font-semibold">You&apos;re invited</h1>
        <p className="text-sm text-muted-foreground">
          Join <strong className="text-foreground">{invite.class_name ? `${invite.school_name} — ${invite.class_name}` : invite.school_name}</strong> as{" "}
          {ROLE_LABEL[invite.role] ?? invite.role} on Brightpath.
        </p>
      </div>

      <InviteAccept token={token} invite={invite} isLoggedIn={!!user} loggedInEmail={user?.email ?? null} />
    </div>
  );
}
