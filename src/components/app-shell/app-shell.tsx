import type { UserRole } from "@/lib/types/database";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNav } from "./mobile-nav";
import { Topbar } from "./topbar";

export interface CurrentUser {
  profileId: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
}

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <DesktopSidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileNav role={user.role} />
    </div>
  );
}
