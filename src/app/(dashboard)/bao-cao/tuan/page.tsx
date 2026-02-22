"use client";

import React from "react";
import { StatisticsView } from "@/components/statistics/StatisticsView";

export default function WeeklyReportPage() {
  return (
    <div className="p-6">
      <StatisticsView defaultGroupBy="week" title="Thống kê theo tuần" />
    </div>
  );
}
