"use client";

import Link from "next/link";
import { Bell, LogOut, Menu, Settings as SettingsIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NAV_BY_ROLE, ROLE_HOME } from "@/lib/nav-config";
import { signOutAction } from "@/lib/actions/auth";
import type { CurrentUser } from "./app-shell";

export function Topbar({ user }: { user: CurrentUser }) {
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const items = NAV_BY_ROLE[user.role];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-10">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <SheetTitle className="mb-4 px-2 font-heading">Brightpath</SheetTitle>
            <nav className="flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="h-[18px] w-[18px]" aria-hidden />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href={ROLE_HOME[user.role]} className="font-heading text-base font-semibold">
          Brightpath
        </Link>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild aria-label="Notifications">
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-accent"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{user.firstName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              {user.firstName} {user.lastName}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`${ROLE_HOME[user.role]}/settings`}>
                <SettingsIcon className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOutAction} className="contents">
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
