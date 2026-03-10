"use client";

import React from "react";
import { StatisticsView } from "@/components/statistics/StatisticsView";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";

export default function DailyReportPage() {
  return (
    <PermissionGuard
      permissions={[Permission.STATISTICS_SEARCH]}
      redirect="/dashboard"
    >
      <StatisticsView
        defaultGroupBy="day"
        title="Báo cáo Doanh thu theo ngày"
      />
    </PermissionGuard>
  );
}
