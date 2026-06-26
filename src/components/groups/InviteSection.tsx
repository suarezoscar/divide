import { useEffect, useRef } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import QRCode from "qrcode";
import styles from "./InviteSection.module.css";

const BASE_URL = "https://divide-app.netlify.app";

interface Props {
  groupId: string;
  open: boolean;
  onClose: () => void;
}

export function InviteSection({ groupId, open, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const joinUrl = `${BASE_URL}/join/${groupId}`;

  useEffect(() => {
    if (open && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, joinUrl, {
        width: 180,
        margin: 1,
        color: { dark: "#1A1A2E", light: "#FFFFFF" },
      });
    }
  }, [open, joinUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS or older browsers
      const input = document.createElement("input");
      input.value = joinUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invitar miembros">
      <div className={styles.content}>
        <p className={styles.hint}>Comparte este enlace para que otros se unan al grupo:</p>

        <div className={styles.linkRow}>
          <code className={styles.link}>{joinUrl}</code>
          <Button size="sm" variant="ghost" onClick={handleCopy} title="Copiar enlace">
            {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
          </Button>
        </div>

        <div className={styles.qrWrapper}>
          <canvas ref={canvasRef} className={styles.qr} />
        </div>

        <p className={styles.qrHint}>Escanea el código QR o comparte el enlace</p>
      </div>
    </Modal>
  );
}
