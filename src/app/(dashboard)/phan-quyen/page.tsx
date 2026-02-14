"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PermissionsPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Phân quyền hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tính năng Phân quyền hệ thống đang được phát triển.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
