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

  const notify = useCallback(async (title: string, body: string) => {
    if (typeof Notification === "undefined") return;

    const currentPermission = Notification.permission;
    if (currentPermission !== "granted") return;

    setPermission(currentPermission);

    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg) {
        await reg.showNotification(title, { body, icon: "/logo.svg", badge: "/logo.svg" });
        return;
      }
    } catch {
      // service worker not available, fall back to plain Notification
    }

    try {
      new Notification(title, { body, icon: "/logo.svg" });
    } catch {
      // Notification constructor may also fail in some contexts
    }
  }, []);

  return { permission, request, notify };
}
