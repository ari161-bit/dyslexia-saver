import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { UploadDropzone } from "@/components/shared/upload-dropzone";

export const metadata: Metadata = { title: "Upload material" };

export default function TeacherUploadPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Upload material"
        description="Add a worksheet or lesson. We'll structure it so you can preview accessible versions before publishing."
      />
      <UploadDropzone destination="teacher" />
    </div>
  );
}
