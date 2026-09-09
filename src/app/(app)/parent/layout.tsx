import { requireRole } from "@/lib/auth/get-current-user";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("parent");
  return children;
}
