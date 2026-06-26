import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import styles from "./Toast.module.css";

interface ToastData {
  message: string;
  type: "success" | "error";
}

let toastListener: ((t: ToastData) => void) | null = null;

export function showToast(message: string, type: "success" | "error" = "success") {
  toastListener?.({ message, type });
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    toastListener = (t: ToastData) => {
      setToast(t);
      setVisible(true);
      setTimeout(() => setVisible(false), 2800);
      setTimeout(() => setToast(null), 3000);
    };
    return () => {
      toastListener = null;
    };
  }, []);

  if (!toast) return null;

  return (
    <div className={`${styles.toast} ${styles[toast.type]} ${visible ? styles.enter : styles.exit}`} role="status" aria-live="polite">
      {toast.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
      <span>{toast.message}</span>
    </div>
  );
}
