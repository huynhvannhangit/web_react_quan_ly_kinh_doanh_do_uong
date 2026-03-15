// cspell:disable
import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit as fsLimit,
  onSnapshot,
} from "firebase/firestore";
import { notificationService, Notification as SQLNotification } from "@/services/notification.service";

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
  const initialFetchedRef = useRef(false);

  const fetchHistory = useCallback(async () => {
    if (!user || !user.id) return;
    
    try {
      const response = await notificationService.findAll(1, 100);
      if (response && response.items) {
        const mapped: AppNotification[] = response.items.map((item: SQLNotification) => ({
          ...item,
          id: item.id.toString(),
          read: item.isRead,
        }));
        setNotifications(mapped);
        setUnreadCount(mapped.filter((n) => !n.read).length);
        initialFetchedRef.current = true;
      }
    } catch (error) {
      console.error("Failed to fetch notification history from SQL:", error);
    }
  }, [user]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user || !user.id) {
      initialFetchedRef.current = false;
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:9999/api";
    const backendUrl = apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;

    const socketInstance = io(`${backendUrl}/notifications`, {
      query: { userId: user.id },
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
        `}
          >
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
          duration: 2000,
        },
      );

      const newNotification = {
        ...payload,
        id: payload.id?.toString() || Date.now().toString(),
        read: false,
      };
      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        setUnreadCount(updated.filter(n => !n.read).length);
        return updated;
      });
    });

    // Use setTimeout to avoid synchronous state update in effect (cascading renders)
    setTimeout(() => {
      setSocket(socketInstance);
    }, 0);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  // Initial fetch from SQL API
  useEffect(() => {
    // Use setTimeout to avoid synchronous state update in effect
    setTimeout(() => {
      fetchHistory();
    }, 0);
  }, [user, fetchHistory]);

  // Optional Firestore sync
  useEffect(() => {
    if (!db || !user || !user.id || !initialFetchedRef.current) return;

    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      fsLimit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) return;
        
        const data: AppNotification[] = [];
        snapshot.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() } as AppNotification;
          data.push(item);
        });

        // Merge logic: prefer local/new notifications, but update from firestore if helpful
        setNotifications((prev) => {
          const merged = [...prev];
          data.forEach((item) => {
            const idStr = item.id?.toString();
            if (idStr) {
              const existingIndex = merged.findIndex(
                (n) => n.id?.toString() === idStr,
              );
              if (existingIndex > -1) {
                // Update existing item with newer data from Firestore
                merged[existingIndex] = {
                  ...merged[existingIndex],
                  ...item,
                  id: idStr,
                  // Optimization: If either source says it's read, keep it read.
                  // This prevents Firestore lag from reverting a locally read notification.
                  read: item.read === true || merged[existingIndex].read === true,
                };
              } else {
                merged.push({ ...item, id: idStr, read: item.read ?? false });
              }
            }
          });
          const sorted = merged.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          
          // Update unread count based on actual merged notifications
          setUnreadCount(sorted.filter((n) => !n.read).length);
          
          return sorted;
        });
      },
      (error) => {
        console.warn(
          "Firestore sync unavailable (expected if API disabled):",
          error.message,
        );
      },
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      if (!isNaN(Number(notificationId))) {
        await notificationService.markAsRead(Number(notificationId));
      }
    } catch (err) {
      console.error("Failed to mark as read in SQL:", err);
    }
    
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all as read in SQL:", err);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const refresh = useCallback(async () => {
    await fetchHistory();
  }, [fetchHistory]);

  return {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh,
  };
};
