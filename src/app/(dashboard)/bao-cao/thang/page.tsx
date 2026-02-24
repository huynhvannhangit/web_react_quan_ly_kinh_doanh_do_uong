"use client";

import React from "react";
import { StatisticsView } from "@/components/statistics/StatisticsView";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";

export default function MonthlyReportPage() {
  return (
    <PermissionGuard
      permissions={[Permission.STATISTICS_VIEW]}
      redirect="/dashboard"
    >
      <div className="p-6">
        <StatisticsView defaultGroupBy="month" title="Thống kê theo tháng" />
      </div>
    </PermissionGuard>
  );
}
