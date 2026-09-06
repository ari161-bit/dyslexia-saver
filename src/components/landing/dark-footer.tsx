import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function DarkFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white px-6 py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white">
            <GraduationCap className="h-3.5 w-3.5" />
          </span>
          <span className="font-heading text-sm font-semibold text-stone-900">Brightpath</span>
        </Link>
        <div className="flex items-center gap-6 text-xs text-stone-500">
          <Link href="/privacy" className="hover:text-stone-900">Privacy Policy</Link>
          <Link href="/login" className="hover:text-stone-900">Log in</Link>
          <Link href="/signup" className="hover:text-stone-900">Sign up</Link>
        </div>
        <p className="text-xs text-stone-400">© {new Date().getFullYear()} Brightpath</p>
      </div>
    </footer>
  );
}
