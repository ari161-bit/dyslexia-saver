"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_BY_ROLE, ROLE_HOME } from "@/lib/nav-config";
import type { UserRole } from "@/lib/types/database";

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role].slice(0, 5);
  const kid = role === "student";

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur md:hidden",
        kid ? "px-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5" : "px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5",
      )}
      aria-label="Primary"
    >
      {items.map((item) => {
        const active =
          item.href === ROLE_HOME[role] ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center font-semibold transition-transform",
              kid ? "gap-1.5 rounded-2xl py-2 text-[12px]" : "gap-1 rounded-lg py-1.5 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
              active && kid && "scale-105",
            )}
          >
            <Icon className={kid ? "h-6 w-6" : "h-5 w-5"} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
