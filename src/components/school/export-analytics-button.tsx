"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SchoolOverviewStats, SchoolClass, EngagementWeek, SchoolAIUsage, SchoolCompletionStats } from "@/lib/data/school";

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell);
          return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(","),
    )
    .join("\n");
}

export function ExportAnalyticsButton({
  schoolName,
  stats,
  classes,
  trend,
  aiUsage,
  completion,
}: {
  schoolName: string;
  stats: SchoolOverviewStats;
  classes: SchoolClass[];
  trend: EngagementWeek[];
  aiUsage: SchoolAIUsage;
  completion: SchoolCompletionStats;
}) {
  function handleExport() {
    const generatedAt = new Date().toISOString();
    const sections = [
      [`Brightpath analytics export — ${schoolName}`],
      [`Generated`, generatedAt],
      [],
      ["Overview"],
      ["Students", stats.students],
      ["Teachers", stats.teachers],
      ["Classes", stats.classes],
      ["Resources", stats.resources],
      ["Assignments created", stats.assignments],
      ["Students using accessibility settings", stats.accessibilityUsage],
      [],
      ["AI adaptation usage"],
      ["Adaptations generated", aiUsage.adaptationsGenerated],
      ["Adaptations approved for students", aiUsage.adaptationsApproved],
      [],
      ["Assignment completion"],
      ["Assignments created", completion.assignmentsCreated],
      ["Submissions received", completion.submissionsReceived],
      ["Submissions reviewed", completion.submissionsReviewed],
      [],
      ["Weekly active students"],
      ["Week starting", "Active students"],
      ...trend.map((w) => [w.weekStart, w.activeStudents]),
      [],
      ["Classes"],
      ["Name", "Grade", "Subject", "Teacher", "Students"],
      ...classes.map((c) => [c.name, c.grade ?? "", c.subject ?? "", c.teacherName, c.studentCount]),
    ];

    const csv = toCsv(sections);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brightpath-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4" /> Export CSV
    </Button>
  );
}
