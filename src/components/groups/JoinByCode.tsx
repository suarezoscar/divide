import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import * as groupsService from "../../services/groups";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import styles from "./JoinByCode.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function JoinByCode({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleCodeChange = (value: string) => {
    // Auto uppercase and limit to 6 chars
    setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
  };

  const handleJoin = async () => {
    if (!user || !code.trim() || !name.trim()) return;
    setJoining(true);
    setError("");

    try {
      const group = await groupsService.getGroupByInviteCode(code);
      if (!group) {
        setError("Código no válido. Revisa que esté bien escrito.");
        setJoining(false);
        return;
      }
      if (group.userIds.includes(user.uid)) {
        navigate(`/group/${group.id}`);
        return;
      }
      await groupsService.addUserToGroup(group.id, user.uid, name.trim());
      onClose();
      setCode("");
      setName("");
      navigate(`/group/${group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al unirse al grupo");
      setJoining(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Unirse a un grupo">
      <div className={styles.form}>
        <Input
          label="Código de invitación"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="ABC123"
          autoComplete="off"
          style={{ textTransform: "uppercase", letterSpacing: 4, fontSize: 20, fontWeight: 700, textAlign: "center" } as React.CSSProperties}
        />
        <Input
          label="Tu nombre en el grupo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="¿Cómo te llamas?"
        />
        {error && <p className={styles.error}>{error}</p>}
        <Button
          onClick={handleJoin}
          disabled={joining || !code.trim() || !name.trim()}
          size="lg"
          style={{ width: "100%" }}
        >
          {joining ? "Uniéndose…" : "Unirse al grupo"}
        </Button>
      </div>
    </Modal>
  );
}
