import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import * as groupsService from "../services/groups";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Users, LogIn } from "lucide-react";
import type { Group } from "../types";
import styles from "./JoinGroupPage.module.css";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function JoinGroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberName, setMemberName] = useState("");
  const [claimExisting, setClaimExisting] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!groupId) return;
    const isUuid = UUID_RE.test(groupId);
    const promise = isUuid
      ? groupsService.getGroup(groupId)
      : groupsService.getGroupByInviteCode(groupId);
    promise
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [groupId]);

  // Show login prompt immediately for unauthenticated users
  if (authLoading) {
    return (
      <div className={styles.shell}>
        <p className={styles.muted}>Cargando…</p>
      </div>
    );
  }

  if (!user) {
    const saveAndGo = () => {
      sessionStorage.setItem("pendingGroupId", groupId!);
    };

    return (
      <div className={styles.shell}>
        <Card className={styles.card}>
          <h1 className={styles.groupName}>Unirse al grupo</h1>
          <p className={styles.desc}>Inicia sesión o regístrate para unirte</p>
          <div className={styles.authButtons}>
            <Link to="/login" onClick={saveAndGo}>
              <Button size="lg" style={{ width: "100%" }}>
                <LogIn size={16} />
                Iniciar sesión
              </Button>
            </Link>
            <Link to="/login" onClick={saveAndGo}>
              <Button size="lg" variant="secondary" style={{ width: "100%" }}>
                Registrarse
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // User is authenticated — wait for group and show join form
  if (loading) {
    return (
      <div className={styles.shell}>
        <p className={styles.muted}>Cargando…</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={styles.shell}>
        <Card className={styles.card}>
          <p className={styles.error}>Grupo no encontrado o enlace inválido</p>
        </Card>
      </div>
    );
  }

  const alreadyInGroup = group.userIds.includes(user.uid);

  if (alreadyInGroup) {
    navigate(`/group/${groupId}`, { replace: true });
    return null;
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (claimExisting) {
      if (!selectedMemberId) return;
    } else {
      if (!memberName.trim()) return;
    }

    setJoining(true);
    setError("");
    try {
      await groupsService.addUserToGroup(
        groupId!,
        user.uid,
        claimExisting ? selectedMemberId : memberName.trim(),
        claimExisting
      );
      navigate(`/group/${groupId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al unirse al grupo");
      setJoining(false);
    }
  };

  const canSubmit = claimExisting ? !!selectedMemberId : !!memberName.trim();

  return (
    <div className={styles.shell}>
      <Card className={styles.card}>
        <h1 className={styles.groupName}>{group.name}</h1>
        {group.description && <p className={styles.desc}>{group.description}</p>}

        <div className={styles.meta}>
          <Users size={16} color="#6B7280" />
          <span>{group.members.length} miembro{group.members.length !== 1 ? "s" : ""}</span>
        </div>

        <form onSubmit={handleJoin} className={styles.form}>
          <div className={styles.claimToggle}>
            <button
              type="button"
              className={`${styles.claimBtn} ${!claimExisting ? styles.claimActive : ""}`}
              onClick={() => setClaimExisting(false)}
            >
              Soy nuevo
            </button>
            <button
              type="button"
              className={`${styles.claimBtn} ${claimExisting ? styles.claimActive : ""}`}
              onClick={() => setClaimExisting(true)}
            >
              Ya soy miembro
            </button>
          </div>

          {claimExisting ? (
            <div className={styles.selectWrapper}>
              <label className={styles.selectLabel}>Elige tu nombre</label>
              <div className={styles.memberOptions}>
                {group.members
                  .filter((m) => !group.userIds.includes(user.uid) || m.id === selectedMemberId)
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`${styles.memberOption} ${selectedMemberId === m.id ? styles.memberOptionActive : ""}`}
                      onClick={() => setSelectedMemberId(m.id)}
                    >
                      <span>{m.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <Input
              label="Tu nombre en el grupo"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="¿Cómo te llamas?"
              required
            />
          )}
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" size="lg" disabled={joining || !canSubmit} style={{ width: "100%" }}>
            {joining ? "Uniéndose…" : "Unirse al grupo"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
