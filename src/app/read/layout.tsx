import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function ReadLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.profile) redirect("/login");
  return children;
}
