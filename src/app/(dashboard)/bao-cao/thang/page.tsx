"use client";

import React from "react";
import { StatisticsView } from "@/components/statistics/StatisticsView";

export default function MonthlyReportPage() {
  return (
    <div className="p-6">
      <StatisticsView defaultGroupBy="month" title="Thống kê theo tháng" />
    </div>
  );
}
