"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_BY_ROLE, ROLE_HOME, ROLE_LABEL } from "@/lib/nav-config";
import type { UserRole } from "@/lib/types/database";

export function DesktopSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];
  const kid = role === "student";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex",
        kid ? "w-72 px-4 py-7" : "w-64 px-4 py-6",
      )}
    >
      <Link href="/" className={cn("mb-8 flex items-center gap-2.5 px-2", kid && "mb-10")}>
        <span
          className={cn(
            "flex items-center justify-center rounded-2xl bg-primary text-primary-foreground",
            kid ? "h-12 w-12 rounded-3xl" : "h-9 w-9 rounded-xl",
          )}
        >
          <GraduationCap className={kid ? "h-7 w-7" : "h-5 w-5"} />
        </span>
        <div className="leading-tight">
          <p className={cn("font-heading font-semibold text-sidebar-foreground", kid ? "text-xl" : "text-base")}>
            Brightpath
          </p>
          <p className={cn("text-muted-foreground", kid ? "text-sm font-medium" : "text-xs")}>{ROLE_LABEL[role]}</p>
        </div>
      </Link>

      <nav className={cn("flex flex-1 flex-col", kid ? "gap-2" : "gap-1")}>
        {items.map((item) => {
          // The role's home item (e.g. "/student") is a prefix of every
          // other sub-route under it ("/student/practice" starts with
          // "/student/") — so it needs an exact match, not startsWith, or
          // it lights up alongside whichever other item is actually active.
          const active =
            item.href === ROLE_HOME[role] ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center transition-all",
                kid
                  ? "gap-3.5 rounded-2xl px-4 py-3.5 text-base font-semibold"
                  : "gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                active
                  ? kid
                    ? "scale-[1.02] bg-primary text-primary-foreground shadow-md"
                    : "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={kid ? "h-6 w-6" : "h-[18px] w-[18px]"} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
