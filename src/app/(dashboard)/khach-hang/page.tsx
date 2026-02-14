"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomerPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý Khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tính năng Quản lý Khách hàng đang được phát triển.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
