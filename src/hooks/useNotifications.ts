import { useState, useCallback, useEffect } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !("permissions" in navigator)) return;
    navigator.permissions.query({ name: "notifications" }).then((status) => {
      status.onchange = () => {
        setPermission(Notification.permission);
      };
    });
  }, []);

  const request = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === "undefined") return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const notify = useCallback((title: string, body: string) => {
    if (permission !== "granted" || typeof Notification === "undefined") return;
    try {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, { body, icon: "/logo.svg", badge: "/logo.svg" });
      });
    } catch {
      // Fallback to plain notification if no SW
      new Notification(title, { body, icon: "/logo.svg" });
    }
  }, [permission]);

  return { permission, request, notify };
}
