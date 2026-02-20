import api from "./api";
import Cookies from "js-cookie";
import { getDeviceId } from "@/utils/device";

export interface LoginResponse {
  code: number;
  status: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authService = {
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
  }) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
      deviceId: getDeviceId(),
    });
    const { accessToken, refreshToken } = response.data.data;

    // Set expiration: 7 days if rememberMe is true, otherwise session cookie
    const cookieOptions = rememberMe ? { expires: 7 } : {};

    // Aggressive cleanup: Clear cookies from potential subpaths and root
    const pathsToClear = ["/", "/cai-dat", "/ho-so", "/login"];
    pathsToClear.forEach((path) => {
      Cookies.remove("token", { path });
      Cookies.remove("user", { path });
      Cookies.remove("refreshToken", { path });
    });

    // Store in cookies for persistence and SSR availability if needed
    Cookies.set("token", accessToken, { ...cookieOptions, path: "/" });
    Cookies.set("refreshToken", refreshToken, { ...cookieOptions, path: "/" });

    // Decode token to get user details and store in cookie
    try {
      const { jwtDecode } = await import("jwt-decode");
      const decoded = jwtDecode<{
        sub: number;
        email?: string;
        fullName?: string;
        role?: unknown;
        avatar?: string | null;
      }>(accessToken);

      const userPayload = {
        id: decoded.sub,
        email: decoded.email || email,
        fullName: decoded.fullName,
        role: decoded.role,
        avatar: decoded.avatar || null,
      };

      Cookies.set("user", JSON.stringify(userPayload), {
        ...cookieOptions,
        path: "/",
      });
    } catch (e) {
      console.error("Failed to decode token", e);
      Cookies.set("user", JSON.stringify({ email }), {
        ...cookieOptions,
        path: "/",
      });
    }

    return response.data;
  },

  logout: () => {
    const pathsToClear = ["/", "/cai-dat", "/ho-so", "/login"];
    pathsToClear.forEach((path) => {
      Cookies.remove("token", { path });
      Cookies.remove("refreshToken", { path });
      Cookies.remove("user", { path });
    });
  },

  getCurrentUser: () => {
    const user = Cookies.get("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!Cookies.get("token");
  },

  updateUserPayload: (
    data: Partial<{ fullName: string; avatar: string | null }>,
  ) => {
    const user = Cookies.get("user");
    if (user) {
      const currentUser = JSON.parse(user);
      const updatedUser = { ...currentUser, ...data };
      Cookies.set("user", JSON.stringify(updatedUser), {
        path: "/",
        sameSite: "Lax",
      });
      return updatedUser;
    }
    return null;
  },
};
