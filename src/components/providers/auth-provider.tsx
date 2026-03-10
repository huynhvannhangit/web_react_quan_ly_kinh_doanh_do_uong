"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Permission } from "@/types";
import { toast } from "sonner";

export interface AuthUser {
  id?: number;
  email: string;
  fullName?: string;
  role?: unknown;
  permissions?: string[];
  avatar?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = useMemo(
    () => [
      "/login",
      "/register",
      "/reset-password",
      "/verify-email",
      "/waiting-approval",
    ],
    [],
  );

  const checkUserRole = (user: AuthUser | null) => {
    if (!user) return false;

    // A user is "approved" (moved out of waiting-approval) if they have an assigned role.
    // Granular permissions will handle what they can see inside the dashboard.
    return (
      user.role &&
      (typeof user.role === "string"
        ? user.role.length > 0
        : Object.keys(user.role as object).length > 0)
    );
  };

  const getRedirectPath = useCallback((user: AuthUser | null) => {
    if (!user) return "/login";
    if (!checkUserRole(user)) return "/waiting-approval";

    const perms = user.permissions || [];
    if (perms.includes(Permission.DASHBOARD_VIEW)) return "/dashboard";
    if (perms.includes(Permission.ORDER_CREATE)) return "/goi-mon";
    if (perms.includes(Permission.INVOICE_SEARCH)) return "/hoa-don";
    if (perms.includes(Permission.PRODUCT_SEARCH)) return "/san-pham";
    if (perms.includes(Permission.TABLE_SEARCH)) return "/ban";

    return "/dashboard"; // Fallback
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getCurrentUser();
      const hasToken = authService.isAuthenticated();

      if (currentUser && hasToken) {
        setUser(currentUser);

        const userHasRole = checkUserRole(currentUser);

        if (!userHasRole && pathname !== "/waiting-approval") {
          router.push("/waiting-approval");
        } else if (
          userHasRole &&
          (pathname === "/waiting-approval" ||
            (pathname === "/dashboard" &&
              !currentUser.permissions?.includes(Permission.DASHBOARD_VIEW)))
        ) {
          if (pathname === "/dashboard") {
            toast.error("Bạn không có quyền truy cập trang Tổng quan");
          }
          router.push(getRedirectPath(currentUser));
        }
      } else {
        if (currentUser && !hasToken) {
          authService.logout();
        }
        setUser(null);
        if (!publicRoutes.includes(pathname)) {
          router.push("/login");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router, publicRoutes, getRedirectPath]);

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false,
  ) => {
    await authService.login(email, password, rememberMe);
    const currentUser = authService.getCurrentUser();

    if (currentUser) {
      setUser(currentUser);
      router.push(getRedirectPath(currentUser));
    } else {
      setUser({ email });
      router.push("/dashboard");
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push("/login");
  };

  const refreshUser = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
