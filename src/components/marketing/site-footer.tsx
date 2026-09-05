import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="font-heading text-base font-semibold">Brightpath</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              An intelligent learning support platform for students, teachers, parents, and
              schools.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#solution" className="hover:text-foreground">How it works</a></li>
                <li><a href="#audiences" className="hover:text-foreground">Who it&apos;s for</a></li>
                <li><a href="#schools" className="hover:text-foreground">For schools</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Account</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground">Log in</Link></li>
                <li><Link href="/signup" className="hover:text-foreground">Sign up</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Trust</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li>Human-reviewed AI content</li>
                <li>No public student data</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Brightpath. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
