import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
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
