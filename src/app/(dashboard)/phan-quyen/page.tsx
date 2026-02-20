"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleList } from "./_components/role-list";
import { UserList } from "./_components/user-list";

export default function PhanQuyenPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Phân quyền hệ thống
        </h2>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Quản lý Vai trò</TabsTrigger>
          <TabsTrigger value="users">Phân quyền Người dùng</TabsTrigger>
        </TabsList>
        <TabsContent value="roles" className="space-y-4">
          <RoleList />
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <UserList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
