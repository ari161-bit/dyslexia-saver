import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  // The email link only carries a one-time exchange code — nothing before
  // this point has actually signed the browser in. Without exchanging it
  // here, updatePasswordAction has no session to act on and fails with
  // "Auth session missing!" no matter what the user types.
  let exchangeFailed = false;
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeFailed = !!error;
  }

  if (!code || exchangeFailed) {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold">This reset link has expired</h1>
          <p className="text-sm text-muted-foreground">
            Reset links only work once and expire after a while. Request a new one to continue.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Send a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">Make it something you&apos;ll remember.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
