import Link from "next/link";
import type { Metadata } from "next";
import { Baby } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RequestLinkForm } from "@/components/parent/request-link-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getLinkedChildren } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Children" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting confirmation",
  approved: "Linked",
  rejected: "Request declined",
};

export default async function ParentChildrenPage() {
  const user = await getCurrentUser();
  const children = await getLinkedChildren(user!.profile!.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Children" description="Link to your child's account using their student code." />

      <Card>
        <CardContent>
          <RequestLinkForm />
        </CardContent>
      </Card>

      {children.length === 0 ? (
        <EmptyState icon={Baby} title="No children linked yet" description="Once you send a request above, it will show up here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {children.map((c) => (
            <Link
              key={c.studentId}
              href={c.status === "approved" ? `/parent/children/${c.studentId}` : "#"}
              className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-4"
            >
              <p className="font-medium">{c.name}</p>
              <Badge variant={c.status === "approved" ? "default" : "secondary"} className="font-normal">
                {STATUS_LABEL[c.status]}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
