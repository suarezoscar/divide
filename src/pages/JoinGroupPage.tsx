import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import * as groupsService from "../services/groups";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Avatar } from "../components/ui/Avatar";
import { Users, LogIn } from "lucide-react";
import { showToast } from "../components/ui/Toast";
import { friendlyError } from "../utils/errors";
import { Skeleton } from "../components/ui/Skeleton";
import type { Group } from "../types";
import styles from "./JoinGroupPage.module.css";

export function JoinGroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showNewMember, setShowNewMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!groupId) return;
    groupsService.getGroupByInviteCode(groupId)
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [groupId]);

  // Show login prompt immediately for unauthenticated users
  if (authLoading) {
    return (
      <div className={styles.shell}>
        <div className={styles.skeletonCard}>
          <Skeleton width="200px" height="24px" />
          <Skeleton width="120px" height="14px" style={{ marginTop: 8 }} />
        </div>
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
            <Link to="/login?mode=register" onClick={saveAndGo}>
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
        <div className={styles.skeletonCard}>
          <Skeleton width="200px" height="24px" />
          <Skeleton width="120px" height="14px" style={{ marginTop: 8 }} />
        </div>
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
    navigate(`/group/${group.id}`, { replace: true });
    return null;
  }

  const unclaimed = group.members.filter((m) => !m.userId);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setJoining(true);
    setError("");
    try {
      if (selectedMemberId) {
        await groupsService.addUserToGroup(group.id, user.uid, selectedMemberId, true);
      } else if (newMemberName.trim()) {
        await groupsService.addUserToGroup(group.id, user.uid, newMemberName.trim(), false);
      } else {
        setJoining(false);
        return;
      }
      showToast("¡Te has unido al grupo!", "success");
      navigate(`/group/${group.id}`, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
      setJoining(false);
    }
  };

  const canSubmit = !!selectedMemberId || newMemberName.trim().length > 0;

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

          <Button type="submit" size="lg" isLoading={joining} disabled={!canSubmit} style={{ width: "100%" }}>
            {selectedMemberId ? "Identificarse en el grupo" : "Unirse al grupo"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
