import { requireRole } from "@/lib/auth/get-current-user";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("student");
  return children;
}
