import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <WifiOff className="h-7 w-7" />
      </span>
      <h1 className="font-heading text-2xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-sm text-muted-foreground">
        Check your connection and try again. Anything you were reading will still be here.
      </p>
    </div>
  );
}
