"use client";

import React from "react";
import { UserList } from "../_components/user-list";
import { Permission } from "@/types";
import { PermissionGuard } from "@/components/shared/PermissionGuard";
import { Card, CardContent } from "@/components/ui/card";

export default function NguoiDungPage() {
  return (
    <PermissionGuard
      permissions={[Permission.USER_MANAGE]}
      redirect="/dashboard"
    >
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#00509E] dark:text-blue-400 uppercase">
              Phân quyền người dùng
            </h1>
          </div>

          <UserList />
        </CardContent>
      </Card>
    </PermissionGuard>
  );
}
