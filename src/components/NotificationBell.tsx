import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, AlertTriangle, Info, X, Package, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";
import { formatDistanceToNow } from "date-fns";

interface AppNotification {
  id: string;
  title: string;
  body?: string;
  type: string;
  category: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  warning: AlertTriangle,
  error: AlertTriangle,
  success: Check,
  alert: AlertTriangle,
  info: Info,
};

const TYPE_COLOR: Record<string, string> = {
  warning: "text-amber-500",
  error: "text-red-500",
  success: "text-green-500",
  alert: "text-orange-500",
  info: "text-blue-500",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/notifications?limit=20`, {
        headers: getAuthHeaders(),
      });
      if (r.ok) {
        const data: AppNotification[] = await r.json();
        setNotifications(data);
        setUnread(data.filter(n => !n.is_read).length);
      }
    } catch (e) {
      logger.error("NotificationBell.load", e);
    }
  }, []);

  const markRead = async (id: string) => {
    try {
      await fetch(`${API_CONFIG.API_ROOT}/notifications/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (e) {
      logger.error("NotificationBell.markRead", e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_CONFIG.API_ROOT}/notifications/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (e) {
      logger.error("NotificationBell.markAllRead", e);
    }
  };

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll every 60 seconds
  useEffect(() => {
    loadNotifications();
    pollRef.current = setInterval(loadNotifications, 60000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadNotifications]);

  const fmtTime = (d: string) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
    catch { return ""; }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) loadNotifications(); }}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all border border-transparent hover:border-white/30 backdrop-blur-sm"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-12 left-0 z-50 w-80 rounded-2xl bg-white/95 dark:bg-gray-900/95 shadow-2xl border border-white/40 dark:border-gray-700/50 backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <Badge className="bg-red-100 text-red-700 text-xs px-1.5 py-0">{unread}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="ml-2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications
              </div>
            ) : (
              notifications.map(n => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                const color = TYPE_COLOR[n.type] ?? "text-blue-500";
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors",
                      !n.is_read && "bg-primary/5 dark:bg-primary/10"
                    )}
                  >
                    <div className={cn("mt-0.5 flex-shrink-0", color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold truncate", !n.is_read && "text-gray-900 dark:text-gray-100")}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{fmtTime(n.created_at)}</span>
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
            <Link
              to="/settings/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
