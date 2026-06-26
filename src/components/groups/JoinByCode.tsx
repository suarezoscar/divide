import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import * as groupsService from "../../services/groups";
import { showToast } from "../ui/Toast";
import { friendlyError } from "../../utils/errors";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type { Group } from "../../types";
import styles from "./JoinByCode.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function JoinByCode({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [checking, setChecking] = useState(false);
  const [claimExisting, setClaimExisting] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleCodeChange = (value: string) => {
    setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
    setGroup(null);
    setError("");
  };

  const handleCheckCode = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setError("");
    try {
      const g = await groupsService.getGroupByInviteCode(code);
      if (!g) {
        setError("Código no válido. Revisa que esté bien escrito.");
      } else if (g.userIds.includes(user!.uid)) {
        navigate(`/group/${g.id}`);
        onClose();
        return;
      } else {
        setGroup(g);
        setSelectedMemberId("");
        setNewName("");
        setClaimExisting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar el grupo");
    } finally {
      setChecking(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !group) return;
    if (claimExisting && !selectedMemberId) return;
    if (!claimExisting && !newName.trim()) return;

    setJoining(true);
    setError("");
    try {
      await groupsService.addUserToGroup(
        group.id,
        user.uid,
        claimExisting ? selectedMemberId : newName.trim(),
        claimExisting
      );
      showToast("¡Te has unido al grupo!", "success");
      onClose();
      setCode("");
      setGroup(null);
      navigate(`/group/${group.id}`);
    } catch (err) {
      setError(friendlyError(err));
      setJoining(false);
    }
  };

  const canSubmit = group
    ? (claimExisting ? !!selectedMemberId : !!newName.trim())
    : false;

  const filteredMembers = group
    ? group.members.filter(
        (m) => !group.userIds.includes(user?.uid ?? "") || m.id === selectedMemberId
      )
    : [];

  // Reset state when modal opens/closes
  const handleClose = () => {
    setCode("");
    setGroup(null);
    setError("");
    setNewName("");
    setClaimExisting(false);
    setSelectedMemberId("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Unirse a un grupo">
      <div className={styles.form}>
        <Input
          label="Código de invitación"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="ABC123"
          autoComplete="off"
          disabled={!!group}
          style={{ textTransform: "uppercase", letterSpacing: 4, fontSize: 20, fontWeight: 700, textAlign: "center" } as React.CSSProperties}
        />

        {!group && (
          <Button onClick={handleCheckCode} isLoading={checking} disabled={!code.trim()} size="lg" style={{ width: "100%" }}>
            Buscar grupo
          </Button>
        )}

        {group && (
          <>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Grupo:</span>
              <span className={styles.resultName}>{group.name}</span>
            </div>

            <div className={styles.claimToggle}>
              <button
                type="button"
                aria-pressed={!claimExisting}
                className={`${styles.claimBtn} ${!claimExisting ? styles.claimActive : ""}`}
                onClick={() => setClaimExisting(false)}
              >
                Soy nuevo
              </button>
              <button
                type="button"
                aria-pressed={claimExisting}
                className={`${styles.claimBtn} ${claimExisting ? styles.claimActive : ""}`}
                onClick={() => setClaimExisting(true)}
              >
                Ya soy miembro
              </button>
            </div>

            {claimExisting ? (
              <div className={styles.memberOptions}>
                {filteredMembers.length === 0 ? (
                  <p className={styles.emptyMembers}>No hay miembros disponibles para reclamar</p>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`${styles.memberOption} ${selectedMemberId === m.id ? styles.memberOptionActive : ""}`}
                      onClick={() => setSelectedMemberId(m.id)}
                    >
                      <span>{m.name}</span>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <Input
                label="Tu nombre en el grupo"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="¿Cómo te llamas?"
              />
            )}
          </>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        {group && (
          <Button onClick={handleJoin} isLoading={joining} disabled={!canSubmit} size="lg" style={{ width: "100%" }}>
            Unirse al grupo
          </Button>
        )}
      </div>
    </Modal>
  );
}
