import { useEffect, useRef, useState, useCallback } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { Copy, Check, RefreshCw } from "lucide-react";
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
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const joinUrl = inviteCode ? `${BASE_URL}/join/${inviteCode}` : "";

  const fetchCode = useCallback(async () => {
    setLoadError(false);
    setInviteCode(null);
    try {
      const code = await generateInviteCode(groupId);
      setInviteCode(code);
    } catch {
      setLoadError(true);
    }
  }, [groupId]);

  // Generate invite code when modal opens
  useEffect(() => {
    if (open) {
      fetchCode();
    } else {
      setInviteCode(null);
      setLoadError(false);
      setCopied(false);
      setCodeCopied(false);
    }
  }, [open, fetchCode]);

  // Generate QR once joinUrl is final
  useEffect(() => {
    if (!open || !inviteCode || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, joinUrl, {
      width: 180,
      margin: 1,
      color: { dark: "#1A1A2E", light: "#FFFFFF" },
    });
  }, [open, inviteCode, joinUrl]);

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
        {!inviteCode && !loadError && (
          /* ── Loading ── */
          <div className={styles.skeletonWrap}>
            <Skeleton width="100%" height="16px" />
            <div className={styles.qrSkeleton} />
            <Skeleton width="140px" height="14px" style={{ margin: "0 auto" }} />
          </div>
        )}

        {loadError && (
          /* ── Error ── */
          <div className={styles.errorWrap}>
            <p className={styles.errorMsg}>Error al generar el código de invitación</p>
            <p className={styles.errorHint}>Comprueba tu conexión e inténtalo de nuevo.</p>
            <Button size="sm" variant="secondary" onClick={fetchCode}>
              <RefreshCw size={14} />
              Reintentar
            </Button>
          </div>
        )}

        {inviteCode && (
          <>
            <p className={styles.hint}>Comparte este enlace para que otros se unan al grupo:</p>

            <div className={styles.linkRow}>
              <code className={styles.link}>{joinUrl}</code>
              <Button size="sm" variant="ghost" onClick={handleCopy(joinUrl, setCopied)} aria-label="Copiar enlace">
                {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
              </Button>
            </div>

            <div className={styles.qrWrapper}>
              <canvas ref={canvasRef} className={styles.qr} />
            </div>

            <div className={styles.divider}>
              <span>o introduce este código</span>
            </div>
            <div className={styles.codeRow}>
              <code className={styles.code}>{inviteCode}</code>
              <Button size="sm" variant="ghost" onClick={handleCopy(inviteCode, setCodeCopied)} aria-label="Copiar código">
                {codeCopied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
              </Button>
            </div>

            <p className={styles.qrHint}>Escanea el QR, comparte el enlace, o dicta el código</p>
          </>
        )}
      </div>
    </Modal>
  );
}
