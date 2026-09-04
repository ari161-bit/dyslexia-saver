import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { UploadDropzone } from "@/components/shared/upload-dropzone";

export const metadata: Metadata = { title: "Upload a page" };

export default function StudentUploadPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Upload a page"
        description="Add a worksheet, photo, or document — we'll turn it into something easier to read."
      />
      <UploadDropzone destination="student" />
    </div>
  );
}
