import { requireRole } from "@/lib/auth/get-current-user";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireRole("teacher");
  return children;
}
