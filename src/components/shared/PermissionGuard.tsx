"use client";

import React, { useMemo, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Permission } from "@/types";
import { useRouter } from "next/navigation";

interface PermissionGuardProps {
  permissions: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirect?: string;
  requireAll?: boolean;
}

export function PermissionGuard({
  permissions,
  children,
  fallback = null,
  redirect,
  requireAll = false,
}: PermissionGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const userPermissions = useMemo(() => {
    return user?.permissions || [];
  }, [user]);

  const hasPermission = useMemo(() => {
    if (!permissions || permissions.length === 0) return true;
    if (requireAll) {
      return permissions.every((p) => userPermissions.includes(p));
    }
    return permissions.some((p) => userPermissions.includes(p));
  }, [permissions, userPermissions, requireAll]);

  useEffect(() => {
    if (!isLoading && !hasPermission && redirect) {
      router.push(redirect);
    }
  }, [hasPermission, redirect, router, isLoading]);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!hasPermission) {
    return redirect ? null : fallback;
  }

  return <>{children}</>;
}
