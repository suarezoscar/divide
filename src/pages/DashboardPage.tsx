import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroups } from "../hooks/useGroups";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Avatar } from "../components/ui/Avatar";
import { JoinByCode } from "../components/groups/JoinByCode";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import { showToast } from "../components/ui/Toast";
import { friendlyError } from "../utils/errors";
import { Plus, Users, LogIn } from "lucide-react";
import type { Member } from "../types";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const { groups, loading, error, create } = useGroups();
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>([""]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const members: Member[] = memberNames
        .filter((n) => n.trim())
        .map((n) => ({ id: crypto.randomUUID(), name: n.trim() }));
      const g = await create(name.trim(), description.trim(), members);
      showToast("Grupo creado", "success");
      setShowCreate(false);
      setName("");
      setDescription("");
      setMemberNames([""]);
      if (g) navigate(`/group/${g.id}`);
    } catch (err) {
      setCreateError(friendlyError(err));
    } finally {
      setCreating(false);
    }
  };

  const addMemberField = () => setMemberNames((prev) => [...prev, ""]);

  const updateMemberName = (i: number, val: string) => {
    setMemberNames((prev) => prev.map((n, idx) => (idx === i ? val : n)));
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Tus grupos</h1>
        </div>
        <Card className={styles.empty}>
          <p style={{ color: "#DC2626" }}>{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Tus grupos</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => setShowJoin(true)} size="sm" variant="ghost">
            <LogIn size={16} />
            Unirse
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus size={16} />
            Nuevo
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className={styles.empty}>
          <p style={{ fontSize: 15, marginBottom: 8 }}>Aún no tienes grupos</p>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>Divide gastos con amigos sin hojas de cálculo</p>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus size={16} /> Crear tu primer grupo
          </Button>
        </Card>
      ) : (
        <div className={styles.list}>
          {groups.map((g) => (
            <Card
              key={g.id}
              className={styles.groupCard}
              onClick={() => navigate(`/group/${g.id}`)}
            >
              <div className={styles.groupInfo}>
                <h3>{g.name}</h3>
                {g.description && <p className={styles.desc}>{g.description}</p>}
              </div>
              <div className={styles.groupMeta}>
                <div className={styles.memberAvatars}>
                  {g.members.slice(0, 4).map((m) => (
                    <Avatar key={m.id} name={m.name} size="sm" />
                  ))}
                  {g.members.length > 4 && (
                    <span className={styles.moreMembers}>+{g.members.length - 4}</span>
                  )}
                </div>
                <span className={styles.memberCount}>
                  <Users size={14} />
                  {g.members.length}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create group modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo grupo">
        <div className={styles.form}>
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Viaje a la playa"
          />
          <Input
            label="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Gastos compartidos del viaje"
          />

          <div className={styles.membersSection}>
            <label className={styles.membersLabel}>Miembros</label>
            {memberNames.map((mn, i) => (
              <Input
                key={i}
                value={mn}
                onChange={(e) => updateMemberName(i, e.target.value)}
                placeholder={`Miembro ${i + 1}`}
              />
            ))}
            <Button variant="ghost" size="sm" onClick={addMemberField} type="button">
              <Plus size={14} /> Añadir miembro
            </Button>
          </div>

          {createError && <p style={{ color: "#DC2626", fontSize: 13, textAlign: "center" }}>{createError}</p>}

          <Button onClick={handleCreate} isLoading={creating} disabled={!name.trim()} size="lg" style={{ width: "100%" }}>
            Crear grupo
          </Button>
        </div>
      </Modal>

      <JoinByCode open={showJoin} onClose={() => setShowJoin(false)} />
    </div>
  );
}
