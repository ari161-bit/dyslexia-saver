import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ROLE_HOME } from "@/lib/nav-config";

export default async function RedirectHomePage() {
  const user = await getCurrentUser();
  if (!user || !user.profile) redirect("/login");
  redirect(ROLE_HOME[user.profile.role]);
}
