"use client";

import React from "react";
import { StatisticsView } from "@/components/statistics/StatisticsView";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";

export default function WeeklyReportPage() {
  return (
    <PermissionGuard
      permissions={[Permission.STATISTICS_VIEW_ALL]}
      redirect="/dashboard"
    >
      <StatisticsView defaultGroupBy="week" title="Thống kê theo tuần" />
    </PermissionGuard>
  );
}
