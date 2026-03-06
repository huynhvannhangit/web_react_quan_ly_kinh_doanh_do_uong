"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth.service";

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
    () => ["/login", "/register", "/reset-password", "/verify-email"],
    [],
  );

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else if (!publicRoutes.includes(pathname)) {
        router.push("/login");
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router, publicRoutes]);

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false,
  ) => {
    await authService.login(email, password, rememberMe);
    const currentUser = authService.getCurrentUser();
    setUser(currentUser || { email });
    router.push("/dashboard");
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
