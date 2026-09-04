import type { Metadata } from "next";
import { MailCheck } from "lucide-react";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <MailCheck className="h-7 w-7" />
      </span>
      <h1 className="font-heading text-2xl font-semibold">Check your inbox</h1>
      <p className="text-sm text-muted-foreground">
        We&apos;ve sent a confirmation link to your email. Click it to activate your account and get
        started.
      </p>
    </div>
  );
}
