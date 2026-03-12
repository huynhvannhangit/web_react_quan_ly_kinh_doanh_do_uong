import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

const getBaseURL = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9999/api";
  // Fix for empty hostname issue (e.g., http://:9999)
  if (url.includes("://:")) {
    return url.replace("://:", "://localhost:");
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token expiration or unauthorized access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      Cookies.remove("user");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    // Handle structured error messages from backend
    if (error.response && error.response.data) {
      const { message, error: errorType } = error.response.data;

      // Extract specific backend message if it exists
      if (message) {
        // If it's an array of messages (like class-validator errors), join them
        if (Array.isArray(message)) {
          error.customMessage = message.join(", ");
        } else {
          error.customMessage = message;
        }
      } else if (errorType) {
        // Fallback to error type string (e.g., 'Bad Request')
        error.customMessage = errorType;
      }
    }

    // Default connection error fallback if no response exists
    if (!error.response) {
      error.customMessage =
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng wifi/3g.";
    }

    // Automatically trigger a toast for API errors EXCEPT 401 (handled by redirect)
    if (error.response?.status !== 401) {
      toast.error(error.customMessage);
    }

    return Promise.reject(error);
  },
);

export default api;
