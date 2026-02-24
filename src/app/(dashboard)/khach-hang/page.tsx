"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";

export default function CustomerPage() {
  return (
    <PermissionGuard permissions={[Permission.USER_VIEW]} redirect="/dashboard">
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
    </PermissionGuard>
  );
}
