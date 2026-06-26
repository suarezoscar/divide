import { Modal } from "./Modal";
import { Button } from "./Button";
import styles from "./ConfirmDialog.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  variant = "default",
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className={styles.body}>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} size="md">
            Cancelar
          </Button>
          <Button
            variant={variant === "danger" ? "primary" : "primary"}
            size="md"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={variant === "danger" ? { background: "#DC2626" } : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
