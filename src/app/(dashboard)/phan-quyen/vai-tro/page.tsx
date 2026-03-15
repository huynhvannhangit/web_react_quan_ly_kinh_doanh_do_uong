"use client";

import React from "react";
import { RoleList } from "../_components/role-list";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { Card, CardContent } from "@/components/ui/card";

export default function VaiTroPage() {
  return (
    <PermissionGuard
      permissions={[Permission.ROLE_VIEW]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Quản lý vai trò & Quyền
            </h1>
          </div>

          <RoleList />
        </CardContent>
      </Card>
    </PermissionGuard>
  );
}
