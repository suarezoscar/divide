import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useGroup } from "../hooks/useGroups";
import * as groupsService from "../services/groups";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Users, LogIn } from "lucide-react";
import styles from "./JoinGroupPage.module.css";

export function JoinGroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { group, loading } = useGroup(groupId!);

  const [memberName, setMemberName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  // Show login prompt immediately for unauthenticated users
  if (authLoading) {
    return (
      <div className={styles.shell}>
        <p className={styles.muted}>Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.shell}>
        <Card className={styles.card}>
          <h1 className={styles.groupName}>Unirse al grupo</h1>
          <p className={styles.desc}>Inicia sesión para ver los detalles y unirte</p>
          <Link to="/login">
            <Button size="lg" style={{ width: "100%" }}>
              <LogIn size={16} />
              Iniciar sesión
            </Button>
          </Link>
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
    if (!user || !memberName.trim()) return;

    setJoining(true);
    setError("");
    try {
      await groupsService.addUserToGroup(groupId!, user.uid, memberName.trim());
      navigate(`/group/${groupId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al unirse al grupo");
      setJoining(false);
    }
  };

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
          <Input
            label="Tu nombre en el grupo"
            value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="¿Cómo te llamas?"
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" size="lg" disabled={joining || !memberName.trim()} style={{ width: "100%" }}>
              {joining ? "Uniéndose…" : "Unirse al grupo"}
            </Button>
          </form>
      </Card>
    </div>
  );
}
