import type { Metadata } from "next";
import { DemoWalkthrough } from "@/components/demo/demo-walkthrough";

export const metadata: Metadata = { title: "Competition Demo" };

// Deliberately public and auth-free: this is the page a judge opens
// directly on a projector/laptop during a live pitch, so it can never
// depend on login working. All content here is the same static demo
// lesson (src/lib/demo-lesson.ts) — no server actions, no database calls.
export default function DemoPage() {
  return <DemoWalkthrough />;
}
