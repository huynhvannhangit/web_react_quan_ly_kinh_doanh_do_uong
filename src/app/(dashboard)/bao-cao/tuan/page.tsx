"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WeeklyReportPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Thống kê theo tuần</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tính năng Thống kê theo tuần đang được phát triển.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
