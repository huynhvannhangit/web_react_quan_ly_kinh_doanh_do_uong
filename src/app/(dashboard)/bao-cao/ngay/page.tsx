"use client";

import React from "react";
import { StatisticsView } from "@/components/statistics/StatisticsView";

export default function DailyReportPage() {
  return (
    <div className="p-6">
      <StatisticsView
        defaultGroupBy="day"
        title="Báo cáo Doanh thu theo ngày"
      />
    </div>
  );
}
