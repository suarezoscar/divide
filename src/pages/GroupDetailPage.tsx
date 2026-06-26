import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useGroup } from "../hooks/useGroups";
import { useExpenses } from "../hooks/useExpenses";
import { useBalances } from "../hooks/useBalances";
import { useNotifications } from "../hooks/useNotifications";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { BalanceSummary } from "../components/balances/BalanceSummary";
import { SettlementList } from "../components/balances/SettlementList";
import { InviteSection } from "../components/groups/InviteSection";
import { GroupDetailSkeleton } from "../components/ui/Skeleton";
import { Skeleton } from "../components/ui/Skeleton";
import { showToast } from "../components/ui/Toast";
import { Plus, Receipt, Users, ArrowRightLeft, Share, Pencil, Trash2, Bell, BellOff } from "lucide-react";
import { formatCurrency, formatDate } from "../utils/format";
import { getCategory } from "../utils/categories";
import type { Member } from "../types";
import styles from "./GroupDetailPage.module.css";

type Tab = "expenses" | "balances" | "members";

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { group, loading, updateMembers, removeMember } = useGroup(groupId!);
  const { expenses, loading: expLoading, remove, changes, clearChanges } = useExpenses(groupId!);
  const { notify, permission, request } = useNotifications();
  const [notifsOn, setNotifsOn] = useState(() => localStorage.getItem(`notif-${groupId}`) !== "off");
  const localActionIds = useRef<Set<string>>(new Set());

  // Toggle notifications
  const toggleNotifs = async () => {
    if (!notifsOn && permission !== "granted") {
      const granted = await request();
      if (!granted) return;
    }
    const next = !notifsOn;
    setNotifsOn(next);
    localStorage.setItem(`notif-${groupId}`, next ? "on" : "off");
  };

  // Watch for remote changes and notify
  useEffect(() => {
    if (!changes || !notifsOn || permission !== "granted") return;

    for (const exp of changes.added) {
      if (localActionIds.current.has(exp.id)) {
        localActionIds.current.delete(exp.id);
        continue;
      }
      const payer = memberById.get(exp.paidBy);
      notify(
        `Nuevo gasto en ${group?.name}`,
        `${payer?.name ?? exp.paidBy} añadió "${exp.description}" (${formatCurrency(exp.amount)})`
      );
    }

    for (const exp of changes.modified) {
      const payer = memberById.get(exp.paidBy);
      notify(
        `Gasto editado en ${group?.name}`,
        `${payer?.name ?? exp.paidBy} editó "${exp.description}"`
      );
    }

    for (const _id of changes.removed) {
      notify(`Gasto eliminado en ${group?.name}`, "Se eliminó un gasto del grupo");
    }

    clearChanges();
  }, [changes, notifsOn, permission, notify, group, clearChanges]);

  const [tab, setTab] = useState<Tab>("expenses");

  // Member maps — built once
  const memberNames = new Map<string, string>();
  const memberById = new Map(group?.members.map((m) => [m.id, m]) ?? []);
  group?.members.forEach((m) => memberNames.set(m.id, m.name));

  const { balances, debts, addSettlement } = useBalances(groupId!, expenses, memberNames);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");

  // Delete dialogs
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);

  const handleAddMember = async () => {
    if (!group || !newMemberName.trim()) return;
    const updated: Member[] = [
      ...group.members,
      { id: crypto.randomUUID(), name: newMemberName.trim() },
    ];
    await updateMembers(updated);
    setNewMemberName("");
    setShowAddMember(false);
    showToast("Miembro añadido", "success");
  };

  if (loading) {
    return <GroupDetailSkeleton />;
  }

  if (!group) {
    return <p style={{ textAlign: "center", padding: 40, color: "#EF4444" }}>Grupo no encontrado</p>;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "expenses", label: "Gastos", icon: <Receipt size={16} /> },
    { key: "balances", label: "Balances", icon: <ArrowRightLeft size={16} /> },
    { key: "members", label: "Miembros", icon: <Users size={16} /> },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>{group.name}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="sm" variant="ghost" onClick={toggleNotifs} aria-label={notifsOn ? "Desactivar notificaciones" : "Activar notificaciones"}>
            {notifsOn ? <Bell size={16} /> : <BellOff size={16} />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowInvite(true)}>
            <Share size={16} />
            Invitar
          </Button>
          <Button size="sm" onClick={() => navigate(`/group/${groupId}/expense/new`)}>
            <Plus size={16} />
            Añadir gasto
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Expenses tab */}
      {tab === "expenses" && (
        <div className={styles.tabContent}>
          {expLoading ? (
            <div className={styles.expenseList}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCard}>
                  <Skeleton width="60%" height="18px" />
                  <Skeleton width="120px" height="14px" style={{ marginTop: 8 }} />
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <Card className={styles.empty}>
              <p>Aún no hay gastos. ¡Añade el primero!</p>
            </Card>
          ) : (
            <>
              {/* Summary bar */}
              <div className={styles.summaryBar}>
                <span className={styles.summaryCount}>{expenses.length} gasto{expenses.length !== 1 ? "s" : ""}</span>
                <span className={styles.summaryTotal}>
                  Total acumulado: <strong>{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</strong>
                </span>
              </div>

              <div className={styles.expenseList}>
                {expenses.map((exp) => {
                const payer = memberById.get(exp.paidBy);
                  const participantCount = exp.splits.length;
                  const totalMembers = group.members.length;
                  return (
                    <Card key={exp.id} className={styles.expenseCard}>
                      {/* Top row: description + amount */}
                      <div className={styles.expenseTopRow}>
                        <span className={styles.expenseDesc}>
                          {(() => { const cat = getCategory(exp.category); return cat ? `${cat.emoji} ` : null; })()}
                          {exp.description}
                        </span>
                        <span className={styles.expenseAmount}>{formatCurrency(exp.amount)}</span>
                      </div>

                      {/* Payer row: avatar + name + date + actions */}
                      <div className={styles.expensePayerRow}>
                        <Avatar name={payer?.name ?? exp.paidBy} size="sm" />
                        <span className={styles.expenseMeta}>
                          {(() => {
                            if (exp.payers && exp.payers.length > 1) {
                              const names = exp.payers.map(p => {
                                const m = memberById.get(p.memberId);
                                return `${m?.name ?? p.memberId} (${formatCurrency(p.amount)})`;
                              }).join(", ");
                              return `${names} · ${formatDate(exp.date)}`;
                            }
                            return `${payer?.name ?? exp.paidBy} · ${formatDate(exp.date)}`;
                          })()}
                        </span>
                        <div className={styles.expenseActions}>
                          <button
                            className={styles.actionBtn}
                            aria-label="Editar gasto"
                            onClick={() => navigate(`/group/${groupId}/expense/${exp.id}`)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className={styles.actionBtn}
                            aria-label="Eliminar gasto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteExpenseId(exp.id);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Participant badge + splits */}
                      {participantCount < totalMembers && (
                        <span className={styles.participantBadge}>
                          {participantCount}/{totalMembers} participantes
                        </span>
                      )}
                      <div className={styles.splitList}>
                        {exp.splits.map((s) => {
                          const member = memberById.get(s.memberId);
                          const isPayer = s.memberId === exp.paidBy;
                          return (
                            <div key={s.memberId} className={styles.splitRow}>
                              <Avatar name={member?.name ?? s.memberId} size="sm" />
                              <span className={styles.splitName}>
                                {member?.name ?? s.memberId}
                                {isPayer && <span className={styles.payerChip}>pagó</span>}
                              </span>
                              <span className={styles.splitAmount}>{formatCurrency(s.amount)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Balances tab */}
      {tab === "balances" && (
        <div className={styles.tabContent}>
          <BalanceSummary balances={balances} />
          <SettlementList
            debts={debts}
            members={group.members}
            onSettle={async (from, to, amount) => {
              await addSettlement(from, to, amount);
              showToast("Deuda saldada", "success");
            }}
          />
        </div>
      )}

      {/* Members tab */}
      {tab === "members" && (
        <div className={styles.tabContent}>
          <div className={styles.memberList}>
            {group.members.map((m) => (
              <Card key={m.id} className={styles.memberCard}>
                <Avatar name={m.name} size="md" />
                <span className={styles.memberName}>{m.name}</span>
                <button
                  className={styles.actionBtn}
                  aria-label={`Quitar a ${m.name}`}
                  onClick={() => setDeleteMemberId(m.id)}
                >
                  <Trash2 size={15} />
                </button>
              </Card>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowAddMember(true)}>
            <Plus size={14} /> Añadir miembro
          </Button>

          <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="Añadir miembro">
            <div className={styles.addMemberForm}>
              <Input
                label="Nombre"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Nombre del miembro"
              />
              <Button onClick={handleAddMember} disabled={!newMemberName.trim()} size="lg" style={{ width: "100%" }}>
                Añadir
              </Button>
            </div>
          </Modal>
        </div>
      )}

      <InviteSection groupId={groupId!} open={showInvite} onClose={() => setShowInvite(false)} />

      <ConfirmDialog
        open={!!deleteExpenseId}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={() => { if (deleteExpenseId) { remove(deleteExpenseId); showToast("Gasto eliminado", "success"); } }}
        title="¿Eliminar este gasto?"
        message="Se eliminará el gasto y se recalcularán los balances. Esta acción no se puede deshacer."
        confirmLabel="Eliminar gasto"
        variant="danger"
      />

      <ConfirmDialog
        open={!!deleteMemberId}
        onClose={() => setDeleteMemberId(null)}
        onConfirm={() => { if (deleteMemberId) { removeMember(deleteMemberId); showToast("Miembro eliminado", "success"); } }}
        title="¿Quitar a este miembro?"
        message="El miembro se eliminará del grupo actual. Los gastos anteriores se conservan en el historial."
        confirmLabel="Quitar miembro"
        variant="danger"
      />
    </div>
  );
}
