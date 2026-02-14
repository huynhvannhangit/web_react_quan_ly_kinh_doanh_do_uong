import api from "./api";
import { LoginResponse } from "@/types";

export const login = async (email: string, password: string) => {
  const response = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
    deviceId: "web-client",
  });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};
