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

    // Define prioritized routes with their required permissions
    const routePriority = [
      {
        path: "/dashboard",
        perms: [Permission.DASHBOARD_MENU, Permission.DASHBOARD_VIEW],
      },
      {
        path: "/goi-mon",
        perms: [Permission.ORDER_MENU, Permission.ORDER_CREATE],
      },
      {
        path: "/hoa-don",
        perms: [Permission.INVOICE_MENU, Permission.INVOICE_VIEW],
      },
      {
        path: "/ban",
        perms: [Permission.TABLE_MENU, Permission.TABLE_VIEW],
      },
      {
        path: "/nhan-vien",
        perms: [Permission.EMPLOYEE_MENU, Permission.EMPLOYEE_VIEW],
      },
      {
        path: "/tai-khoan",
        perms: [Permission.USER_MENU, Permission.USER_VIEW],
      },
      {
        path: "/khu-vuc",
        perms: [Permission.AREA_MENU, Permission.AREA_VIEW],
      },
      {
        path: "/san-pham",
        perms: [Permission.PRODUCT_MENU, Permission.PRODUCT_VIEW],
      },
      {
        path: "/danh-muc",
        perms: [Permission.CATEGORY_MENU, Permission.CATEGORY_VIEW],
      },
      {
        path: "/phan-quyen/vai-tro",
        perms: [Permission.ROLE_MENU, Permission.ROLE_VIEW],
      },
      {
        path: "/phe-duyet",
        perms: [Permission.APPROVAL_MENU, Permission.APPROVAL_VIEW],
      },
      {
        path: "/bao-cao/ngay",
        perms: [Permission.STATISTICS_MENU, Permission.STATISTICS_VIEW],
      },
      {
        path: "/chat-ai",
        perms: [Permission.AI_ASSISTANT_MENU, Permission.AI_ASSISTANT_CHAT],
      },
      {
        path: "/cau-hinh",
        perms: [Permission.SETTING_MENU, Permission.SETTING_MANAGE],
      },
      {
        path: "/nhat-ky",
        perms: [Permission.LOGGING_MENU, Permission.LOGGING_VIEW],
      },
    ];

    // Find the first route the user has access to
    for (const route of routePriority) {
      if (route.perms.some(p => perms.includes(p))) {
        return route.path;
      }
    }

    return "/ho-so"; // Fallback to profile if no other page is accessible
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getCurrentUser();
      const hasToken = authService.isAuthenticated();

      if (currentUser && hasToken) {
        // Only update if data actually changed to prevent unstable object identity
        // which causes hooks like useSocket to re-run effects
        setUser((prevUser) => {
          if (JSON.stringify(prevUser) !== JSON.stringify(currentUser)) {
            return currentUser;
          }
          return prevUser;
        });

        const userHasRole = checkUserRole(currentUser);

        if (!userHasRole && pathname !== "/waiting-approval") {
          router.push("/waiting-approval");
        } else if (
          userHasRole &&
          (pathname === "/waiting-approval" ||
            (pathname === "/dashboard" &&
              !currentUser.permissions?.includes(
                Permission.DASHBOARD_VIEW,
              )))
        ) {
          // SILENT REDIRECT: removed toast.error for restricted roles
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
