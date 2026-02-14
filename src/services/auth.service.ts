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

    // Store in cookies for persistence and SSR availability if needed
    Cookies.set("token", accessToken, cookieOptions);
    Cookies.set("refreshToken", refreshToken, cookieOptions);
    // Store email temporarily until we can get user details from token
    Cookies.set("user", JSON.stringify({ email }), cookieOptions);

    return response.data;
  },

  logout: () => {
    Cookies.remove("token");
    Cookies.remove("user");
  },

  getCurrentUser: () => {
    const user = Cookies.get("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!Cookies.get("token");
  },
};
