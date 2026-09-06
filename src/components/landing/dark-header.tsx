"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "#problem", label: "The problem" },
  { href: "#product", label: "Product" },
  { href: "#trust", label: "Trust" },
];

export function DarkHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b border-stone-200 bg-white/85 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white">
            <GraduationCap className="h-3.5 w-3.5" />
          </span>
          <span className="font-heading text-sm font-semibold tracking-wide text-stone-900">Brightpath</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-xs font-medium tracking-wide text-stone-500 transition-colors hover:text-stone-900">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-xs font-medium text-stone-500 hover:text-stone-900 sm:inline">
            Log in
          </Link>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-orange-500 text-white hover:bg-orange-600"
          >
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
