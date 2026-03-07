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

import { AuthUser } from "@/components/providers/auth-provider";

export const useSocket = (user: AuthUser | null | undefined) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user || !user.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:9999/api";
    // Extract base backend URL from API URL for WebSocket
    const backendUrl = apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;

    // Connect to /notifications namespace
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

    // Listen for realtime notifications from server
    socketInstance.on("notification", (payload: AppNotification) => {
      console.log("New notification received:", payload);

      toast.custom(
        (t) => (
          <div
            className={`
          flex w-105 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800/50
          shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] 
          rounded-2xl pointer-events-auto overflow-hidden relative group
          transition-all duration-500 ease-in-out
          animate-in slide-in-from-right-full
          data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-full
        `}
          >
            {/* Ambient background glow matching type */}
            <div
              className={`
              absolute -left-20 -top-20 w-40 h-40 blur-[60px] opacity-20 pointer-events-none
              ${
                payload.type === "success"
                  ? "bg-green-500"
                  : payload.type === "error"
                    ? "bg-red-500"
                    : payload.type === "warning"
                      ? "bg-amber-500"
                      : "bg-blue-500"
              }
            `}
            />

            <div className="flex-1 p-5 relative z-10">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase flex items-center gap-2">
                  {payload.title}
                  {payload.type === "success" && (
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </h4>
                <p className="mt-1.5 text-[13px] leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                  {payload.message}
                </p>
              </div>
            </div>

            <div className="flex items-center p-3 relative z-10 border-l border-slate-100 dark:border-slate-800/50">
              <button
                onClick={() => toast.dismiss(t)}
                className="h-full px-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ),
        {
          duration: 5000,
        },
      );

      // Update local state immediately
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Sync data with Firebase Firestore (notification history)
  useEffect(() => {
    if (!db || !user || !user.id) return;

    // Listen for realtime updates from Firebase Firestore (notification history)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    // Update local state (ideally sync with Firebase as well)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
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
