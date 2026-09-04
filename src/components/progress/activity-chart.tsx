"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { format } from "date-fns";
import type { ProgressDay } from "@/lib/data/student";

export function ActivityChart({ data }: { data: ProgressDay[] }) {
  const chartData = data.map((d) => ({ ...d, label: format(new Date(d.date), "MMM d") }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          interval="preserveStartEnd"
          stroke="var(--muted-foreground)"
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
          labelFormatter={(label) => label}
          formatter={(value) => [`${value} activities`, ""]}
        />
        <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} fill="url(#activityFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
