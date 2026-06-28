import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { useGroup } from "../hooks/useGroups";
import { useAuth } from "../hooks/useAuth";
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
import { ExpenseDonut } from "../components/balances/ExpenseDonut";
import { InviteSection } from "../components/groups/InviteSection";
import { GroupDetailSkeleton } from "../components/ui/Skeleton";
import { Skeleton } from "../components/ui/Skeleton";
import { showToast } from "../components/ui/Toast";
import { Plus, Receipt, Users, ArrowRightLeft, Share, Pencil, Trash2, Bell, BellOff } from "lucide-react";
import { formatCurrency, formatDate } from "../utils/format";
import { getCategory } from "../utils/categories";
import { getGroupColor, getGroupColorRgba } from "../utils/groupColors";
import type { Member } from "../types";
import styles from "./GroupDetailPage.module.css";

type Tab = "expenses" | "balances" | "members";

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { group, loading, updateMembers, removeMember, removeGroup } = useGroup(groupId!);
  const { expenses, loading: expLoading, remove, changes, clearChanges } = useExpenses(groupId!);
  const { notify, permission, request } = useNotifications();
  const [notifsOn, setNotifsOn] = useState(() => localStorage.getItem(`notif-${groupId}`) !== "off");
  const pendingNotifs = useRef<any[]>([]);
  const notifTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Member maps — built once (declared early for notification effect)
  const memberNames = new Map<string, string>();
  const memberById = new Map(group?.members.map((m) => [m.id, m]) ?? []);
  group?.members.forEach((m) => memberNames.set(m.id, m.name));

  // Members involved in at least one expense (cannot be removed)
  const expenseMemberIds = useMemo(() => {
    const ids = new Set<string>();
    for (const exp of expenses) {
      ids.add(exp.paidBy);
      for (const split of exp.splits) {
        ids.add(split.memberId);
      }
    }
    return ids;
  }, [expenses]);

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

  // Watch for remote changes and notify — debounced, only 'added'
  useEffect(() => {
    if (!changes || !notifsOn || permission !== "granted") return;

    const filterSelf = sessionStorage.getItem(`lastAdded-${groupId}`);
    const remoteAdded = filterSelf
      ? changes.added.filter((e) => e.id !== filterSelf)
      : changes.added;

    if (remoteAdded.length === 0) {
      clearChanges();
      return;
    }

    // Accumulate pending notifications
    pendingNotifs.current.push(...remoteAdded);
    clearChanges();

    // Debounce: wait 3s to batch notifications
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => {
      const batch = pendingNotifs.current;
      pendingNotifs.current = [];
      if (batch.length === 0) return;

      if (batch.length === 1) {
        const exp = batch[0];
        const payer = memberById.get(exp.paidBy);
        notify(
          `Nuevo gasto en ${group?.name}`,
          `${payer?.name ?? "(ex-miembro)"} añadió "${exp.description}" (${formatCurrency(exp.amount)})`
        );
      } else {
        notify(
          `${batch.length} gastos nuevos en ${group?.name}`,
          batch.map((e) => `• ${e.description}`).join("\n")
        );
      }
    }, 3000);

    return () => {
      if (notifTimer.current) clearTimeout(notifTimer.current);
    };
  }, [changes, notifsOn, permission, notify, group, groupId, clearChanges, memberById]);

  const [tab, setTab] = useState<Tab>("expenses");

  const { balances, debts, addSettlement } = useBalances(groupId!, expenses, memberNames);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");

  // Delete dialogs
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);

  const handleDeleteGroup = async () => {
    await removeGroup();
    showToast("Grupo eliminado", "success");
    navigate("/dashboard", { replace: true });
  };

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
    return <p style={{ textAlign: "center", padding: 40, color: "#DC2626" }}>Grupo no encontrado</p>;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "expenses", label: "Gastos", icon: <Receipt size={16} /> },
    { key: "balances", label: "Balances", icon: <ArrowRightLeft size={16} /> },
    { key: "members", label: "Miembros", icon: <Users size={16} /> },
  ];

  const groupColor = getGroupColor(group.name);
  const groupColorLight = getGroupColorRgba(group.name, 0.08);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 style={{ borderBottom: `2px solid ${groupColor}`, paddingBottom: 4 }}>{group.name}</h1>
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
              <p style={{ marginBottom: 6 }}>Aún no hay gastos</p>
              <p style={{ fontSize: 13, color: "#6B7280" }}>Los gastos se dividen automáticamente entre los miembros. ¡Añade el primero!</p>
            </Card>
          ) : (
            <>
              {/* Summary bar */}
              <div className={styles.summaryBar} style={{ background: groupColorLight, borderColor: getGroupColorRgba(group.name, 0.15) }}>
                <span className={styles.summaryCount}>{expenses.length} gasto{expenses.length !== 1 ? "s" : ""}</span>
                <span className={styles.summaryTotal}>
                  Total acumulado: <strong>{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</strong>
                </span>
              </div>

              <div className={styles.expenseList}>
                {expenses.map((exp) => {
                const payer = memberById.get(exp.paidBy);
                const payerName = payer?.name ?? "(ex-miembro)";
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
                        <Avatar name={payerName} size="sm" />
                        <span className={styles.expenseMeta}>
                          {(() => {
                            if (exp.payers && exp.payers.length > 1) {
                              const names = exp.payers.map(p => {
                                const m = memberById.get(p.memberId);
                                return `${m?.name ?? p.memberId} (${formatCurrency(p.amount)})`;
                              }).join(", ");
                              return `${names} · ${formatDate(exp.date)}`;
                            }
                            return `${payerName} · ${formatDate(exp.date)}`;
                          })()}
                        </span>
                        <div className={styles.expenseActions}>
                          {(exp.createdBy === user?.uid || !exp.createdBy) && (
                            <button
                              className={styles.actionBtn}
                              aria-label="Editar gasto"
                              onClick={() => navigate(`/group/${groupId}/expense/${exp.id}`)}
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {(exp.createdBy === user?.uid || !exp.createdBy) && (
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
                          )}
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
                          const memberName = member?.name ?? "(ex-miembro)";
                          const isPayer = s.memberId === exp.paidBy;
                          return (
                            <div key={s.memberId} className={styles.splitRow}>
                              <Avatar name={memberName} size="sm" />
                              <span className={styles.splitName}>
                                {memberName}
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
          <ExpenseDonut
            balances={balances.map((b) => ({ memberId: b.memberId, memberName: b.memberName, amount: b.owed }))}
            total={expenses.reduce((s, e) => s + e.amount, 0)}
          />
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
            {group.members.map((m) => {
              const isInExpense = expenseMemberIds.has(m.id);
              return (
                <Card key={m.id} className={styles.memberCard}>
                  <Avatar name={m.name} size="md" />
                  <span className={styles.memberName}>{m.name}</span>
                  <button
                    className={`${styles.actionBtn} ${isInExpense ? styles.actionBtnDisabled : ""}`}
                    aria-label={isInExpense ? `${m.name} no se puede quitar porque está en gastos` : `Quitar a ${m.name}`}
                    title={isInExpense ? "No se puede eliminar: está involucrado en uno o más gastos" : undefined}
                    disabled={isInExpense}
                    onClick={() => !isInExpense && setDeleteMemberId(m.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </Card>
              );
            })}
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

      {user?.uid === group.createdBy && (
        <div className={styles.dangerZone}>
          <p className={styles.dangerZoneTitle}>Administración del grupo</p>
          <Button
            size="md"
            variant="ghost"
            onClick={() => setShowDeleteGroup(true)}
            style={{ width: "100%", color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}
          >
            <Trash2 size={16} />
            Eliminar grupo
          </Button>
        </div>
      )}

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

      <ConfirmDialog
        open={showDeleteGroup}
        onClose={() => setShowDeleteGroup(false)}
        onConfirm={handleDeleteGroup}
        title="¿Eliminar este grupo?"
        message="Se eliminarán el grupo, todos sus gastos y todos los pagos registrados. Esta acción no se puede deshacer."
        confirmLabel="Eliminar grupo"
        variant="danger"
      />
    </div>
  );
}
