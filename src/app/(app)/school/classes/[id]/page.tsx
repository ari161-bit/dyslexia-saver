import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ClassStream } from "@/components/classes/class-stream";
import { getClassBasicInfo, getClassStream } from "@/lib/data/class-stream";

export const metadata: Metadata = { title: "Class" };

export default async function SchoolClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [info, stream] = await Promise.all([getClassBasicInfo(id), getClassStream(id)]);
  if (!info) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={info.name} description={info.subject ?? "General"} />
      <ClassStream classId={id} posts={stream} canPost />
    </div>
  );
}
