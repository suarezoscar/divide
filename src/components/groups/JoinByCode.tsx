import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import * as groupsService from "../../services/groups";
import { showToast } from "../ui/Toast";
import { friendlyError } from "../../utils/errors";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Avatar } from "../ui/Avatar";
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
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showNewMember, setShowNewMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
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
        setSelectedMemberId(null);
        setShowNewMember(false);
        setNewMemberName("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar el grupo");
    } finally {
      setChecking(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !group) return;
    setJoining(true);
    setError("");
    try {
      if (selectedMemberId) {
        await groupsService.addUserToGroup(group.id, user.uid, selectedMemberId, true, user.uid);
      } else if (newMemberName.trim()) {
        await groupsService.addUserToGroup(group.id, user.uid, newMemberName.trim(), false, user.uid);
      } else {
        setJoining(false);
        return;
      }
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

  const canSubmit = !!selectedMemberId || newMemberName.trim().length > 0;

  const unclaimed = group ? group.members.filter((m) => !m.userId) : [];

  // Reset state when modal opens/closes
  const handleClose = () => {
    setCode("");
    setGroup(null);
    setError("");
    setNewMemberName("");
    setShowNewMember(false);
    setSelectedMemberId(null);
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

            {/* Unclaimed members */}
            {unclaimed.length > 0 && (
              <>
                <h2 className={styles.sectionTitle}>¿Eres uno de estos?</h2>
                <div className={styles.memberOptions}>
                  {unclaimed.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`${styles.memberOption} ${selectedMemberId === m.id ? styles.memberOptionActive : ""}`}
                      onClick={() => {
                        setSelectedMemberId(m.id);
                        setShowNewMember(false);
                        setNewMemberName("");
                      }}
                    >
                      <Avatar name={m.name} size="sm" id={m.id} />
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>

                <div className={styles.divider}>
                  <span>o</span>
                </div>
              </>
            )}

            {/* New member */}
            {!showNewMember ? (
              <button
                type="button"
                className={styles.toggleNew}
                onClick={() => {
                  setShowNewMember(true);
                  setSelectedMemberId(null);
                }}
              >
                + No estoy en la lista
              </button>
            ) : (
              <div className={styles.newMemberSection}>
                <Input
                  label="Tu nombre en el grupo"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="¿Cómo te llamas?"
                />
              </div>
            )}

            {error && <p className={styles.error} role="alert">{error}</p>}

            <Button onClick={handleJoin} isLoading={joining} disabled={!canSubmit} size="lg" style={{ width: "100%" }}>
              {selectedMemberId ? "Identificarse en el grupo" : "Unirse al grupo"}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
