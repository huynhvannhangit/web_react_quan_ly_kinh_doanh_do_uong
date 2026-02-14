"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MonthlyReportPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Thống kê theo tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tính năng Thống kê theo tháng đang được phát triển.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
