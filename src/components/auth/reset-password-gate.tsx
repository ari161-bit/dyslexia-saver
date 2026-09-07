"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ResetPasswordForm } from "./reset-password-form";

type Status = "checking" | "ready" | "invalid";

export function ResetPasswordGate() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    // Password recovery links land here with the session in the URL
    // fragment (#access_token=...&refresh_token=...&type=recovery), not a
    // query string — browsers never send a fragment to the server, so this
    // has to be parsed and exchanged for a session client-side.
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    const supabase = createClient();

    async function establishSession() {
      if (accessToken && refreshToken && type === "recovery") {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        // Drop the tokens from the URL so they don't linger in history/logs.
        window.history.replaceState(null, "", window.location.pathname);
        setStatus(error ? "invalid" : "ready");
        return;
      }

      const { data } = await supabase.auth.getSession();
      setStatus(data.session ? "ready" : "invalid");
    }

    establishSession();
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking your link…
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          This reset link has expired or already been used. Request a new one to continue.
        </p>
        <Link href="/forgot-password" className="inline-flex text-sm font-medium text-primary hover:underline">
          Send a new reset link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
