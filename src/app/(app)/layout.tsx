import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (!user.profile) redirect("/login");

  return (
    <AppShell
      user={{
        profileId: user.profile.id,
        firstName: user.profile.first_name,
        lastName: user.profile.last_name,
        role: user.profile.role,
        avatarUrl: user.profile.avatar_url,
      }}
    >
      {children}
    </AppShell>
  );
}
