import { useEffect, useRef, useState, useCallback } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { generateInviteCode } from "../../services/groups";
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
  const [codeCopied, setCodeCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);  // null = still loading

  const joinUrl = inviteCode
    ? `${BASE_URL}/join/${inviteCode}`
    : `${BASE_URL}/join/${groupId}`;

  // Generate invite code when opened
  const fetchCode = useCallback(async () => {
    try {
      const code = await generateInviteCode(groupId);
      setInviteCode(code);
    } catch {
      // silently ignore — code is optional
    }
  }, [groupId]);

  useEffect(() => {
    if (open) {
      fetchCode();
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, joinUrl, {
          width: 180,
          margin: 1,
          color: { dark: "#1A1A2E", light: "#FFFFFF" },
        });
      }
    }
  }, [open, joinUrl, fetchCode]);

  const handleCopy = (text: string, setter: (v: boolean) => void) => async () => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setter(true);
      setTimeout(() => setter(false), 2000);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invitar miembros">
      <div className={styles.content}>
        <p className={styles.hint}>Comparte este enlace para que otros se unan al grupo:</p>

        <div className={styles.linkRow}>
          <code className={styles.link}>{joinUrl}</code>
          <Button size="sm" variant="ghost" onClick={handleCopy(joinUrl, setCopied)} title="Copiar enlace">
            {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
          </Button>
        </div>

        <div className={styles.qrWrapper}>
          <canvas ref={canvasRef} className={styles.qr} />
        </div>

        {inviteCode && (
          <>
            <div className={styles.divider}>
              <span>o introduce este código</span>
            </div>
            <div className={styles.codeRow}>
              <code className={styles.code}>{inviteCode}</code>
              <Button size="sm" variant="ghost" onClick={handleCopy(inviteCode, setCodeCopied)} title="Copiar código">
                {codeCopied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
              </Button>
            </div>
          </>
        )}

        <p className={styles.qrHint}>Escanea el QR, comparte el enlace, o dicta el código</p>
      </div>
    </Modal>
  );
}
