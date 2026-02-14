"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DailyReportPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo Doanh thu theo ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tính năng Báo cáo theo ngày đang được phát triển.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
