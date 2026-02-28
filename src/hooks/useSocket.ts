import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

export interface AppNotification {
  id?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read?: boolean;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Khởi tạo kết nối Socket.IO
  useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:9999/api";
    // Tách phần /api ra để lấy gốc domain của backend cho WebSocket
    const backendUrl = apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;

    // Kết nối đến namespace /notifications
    const socketInstance = io(`${backendUrl}/notifications`, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    // Lắng nghe sự kiện thông báo realtime từ server
    socketInstance.on("notification", (payload: AppNotification) => {
      console.log("New notification received:", payload);

      // Hiển thị toast
      toast.info(payload.title, {
        description: payload.message,
        duration: 5000,
      });

      // Cập nhật state local ngay lập tức
      const newNotification = {
        ...payload,
        id: Date.now().toString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Sync dữ liệu với Firebase Firestore (lịch sử thông báo)
  useEffect(() => {
    if (!db) return;

    // Lắng nghe realtime từ collection 'notifications' trên Firestore
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: AppNotification[] = [];
        let unread = 0;

        snapshot.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() } as AppNotification;
          data.push(item);
          if (!item.read) unread++;
        });

        setNotifications(data);
        setUnreadCount(unread);
      },
      (error) => {
        console.error("Error fetching notifications from Firestore:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  // Hàm đánh dấu đã đọc
  const markAsRead = useCallback(async (notificationId: string) => {
    // Chỉ cập nhật state local, thực tế nên update document Firebase
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Hàm đánh dấu tất cả đã đọc
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};
