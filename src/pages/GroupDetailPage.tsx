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
import { CategoryBreakdown } from "../components/balances/CategoryBreakdown";
import { InviteSection } from "../components/groups/InviteSection";
import { ActivityLog } from "../components/activity/ActivityLog";
import { GroupDetailSkeleton } from "../components/ui/Skeleton";
import { Skeleton } from "../components/ui/Skeleton";
import { showToast } from "../components/ui/Toast";
import { Plus, Receipt, Clock, ArrowRightLeft, Share, Pencil, Trash2, Bell, BellOff, LogOut, Settings } from "lucide-react";
import { formatCurrency, formatDate } from "../utils/format";
import { getCategory } from "../utils/categories";
import { getGroupColorRgba } from "../utils/groupColors";
import type { Member } from "../types";
import styles from "./GroupDetailPage.module.css";

type Tab = "expenses" | "balances" | "activity";

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { group, loading, linkedMemberId, updateMembers, removeMember, removeGroup, claimMember, leaveGroup, updateGroupInfo } = useGroup(groupId!);
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

  // Category totals for breakdown
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      const cat = exp.category ?? "other";
      map.set(cat, (map.get(cat) ?? 0) + exp.amount);
    }
    return Array.from(map.entries()).map(([categoryId, amount]) => ({ categoryId, amount }));
  }, [expenses]);

  const categoryTotalAmount = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  // Auto-claim modal: if no linked member, ask "Who are you?"
  const [showClaimModal, setShowClaimModal] = useState(false);
  useEffect(() => {
    if (!loading && group && user && !linkedMemberId) {
      const unclaimed = group.members.filter((m) => !m.userId);
      if (unclaimed.length > 0) setShowClaimModal(true);
    }
  }, [loading, group?.id, user?.uid, linkedMemberId]);

  const handleClaim = async (memberId: string) => {
    await claimMember(memberId);
    setShowClaimModal(false);
  };

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

  // Collapsible expenses
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set());
  const toggleExpense = (id: string) => {
    setExpandedExpenses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Delete dialogs
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  const [showLeaveGroup, setShowLeaveGroup] = useState(false);

  const handleDeleteGroup = async () => {
    await removeGroup();
    showToast("Grupo eliminado", "success");
    navigate("/dashboard", { replace: true });
  };

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setGroupDescription(group.description ?? "");
    }
  }, [group]);

  const handleSaveGroupInfo = async () => {
    if (!groupName.trim()) return;
    await updateGroupInfo(groupName.trim(), groupDescription.trim());
    showToast("Datos del grupo guardados", "success");
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
    { key: "activity", label: "Historial", icon: <Clock size={16} /> },
  ];

  const currentMemberName = user ? group.members.find((m) => m.userId === user.uid)?.name : undefined;

  const groupColorLight = getGroupColorRgba(group.name, 0.08);

  return (
    <div className={styles.page}>
      {/* Header: single row */}
      <div className={styles.header} style={{ background: `linear-gradient(180deg, ${getGroupColorRgba(group.name, 0.08)} 0%, transparent 100%)` }}>
        <h1 className={styles.headerTitle}>{group.name}</h1>
        <div className={styles.headerActions}>
          <button className={styles.headerIconBtn} onClick={toggleNotifs} aria-label={notifsOn ? "Desactivar notificaciones" : "Activar notificaciones"}>
            {notifsOn ? <Bell size={18} /> : <BellOff size={18} />}
          </button>
          <button className={styles.headerIconBtn} onClick={() => setShowSettings(true)} aria-label="Ajustes del grupo">
            <Settings size={18} />
          </button>
          <button className={styles.headerIconBtn} onClick={() => setShowInvite(true)} aria-label="Invitar miembros">
            <Share size={18} />
          </button>
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
                  return (
                    <Card
                      key={exp.id}
                      className={`${styles.expenseCard} ${expandedExpenses.has(exp.id) ? styles.expenseCardExpanded : ""}`}
                      onClick={() => toggleExpense(exp.id)}
                      aria-expanded={expandedExpenses.has(exp.id)}
                    >
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
                        <Avatar name={payerName} size="sm" id={exp.paidBy} />
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
                              onClick={(e) => { e.stopPropagation(); navigate(`/group/${groupId}/expense/${exp.id}`); }}
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

                      {/* Collapsed: participant avatars row */}
                      {!expandedExpenses.has(exp.id) && (
                        <div className={styles.avatarRow}>
                          {exp.splits.map((s) => {
                            const m = memberById.get(s.memberId);
                            return <Avatar key={s.memberId} name={m?.name ?? ""} size="sm" id={s.memberId} />;
                          })}
                        </div>
                      )}

                      {/* Expanded: full split list */}
                      {expandedExpenses.has(exp.id) && (
                        <div className={styles.splitList}>
                          {exp.splits.map((s) => {
                            const member = memberById.get(s.memberId);
                            const memberName = member?.name ?? "(ex-miembro)";
                            return (
                              <div key={s.memberId} className={styles.splitRow}>
                                <Avatar name={memberName} size="sm" id={s.memberId} />
                                <span className={styles.splitName}>{memberName}</span>
                                <span className={styles.splitAmount}>{formatCurrency(s.amount)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
          <CategoryBreakdown items={categoryTotals} total={categoryTotalAmount} />
          <ExpenseDonut
            balances={balances.map((b) => ({ memberId: b.memberId, memberName: b.memberName, amount: b.owed }))}
            total={categoryTotalAmount}
          />
          <BalanceSummary balances={balances} />
          <SettlementList
            debts={debts}
            members={group.members}
            onSettle={async (from, to, amount) => {
              const fromMember = memberById.get(from);
              const toMember = memberById.get(to);
              await addSettlement(from, to, amount, user?.uid, currentMemberName, fromMember?.name, toMember?.name);
              showToast("Deuda saldada", "success");
            }}
          />
        </div>
      )}

      {/* Activity tab */}
      {tab === "activity" && (
        <div className={styles.tabContent}>
          <ActivityLog groupId={groupId!} />
        </div>
      )}

      <InviteSection groupId={groupId!} open={showInvite} onClose={() => setShowInvite(false)} />

      {/* Settings modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Ajustes del grupo">
        <div className={styles.settingsBody}>
          {/* Section 1: Ajustes */}
          <section className={styles.settingsSection}>
            <h3 className={styles.settingsSectionTitle}>📝 Ajustes</h3>
            <Input label="Nombre" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nombre del grupo" />
            <Input label="Descripción" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder="Descripción (opcional)" />
            <Button onClick={handleSaveGroupInfo} disabled={!groupName.trim()} size="lg" style={{ width: "100%" }}>
              Guardar cambios
            </Button>
          </section>

          <hr className={styles.settingsDivider} />

          {/* Section 2: Miembros */}
          <section className={styles.settingsSection}>
            <h3 className={styles.settingsSectionTitle}>👥 Miembros</h3>
            <div className={styles.memberList}>
              {group.members.map((m) => {
                const isInExpense = expenseMemberIds.has(m.id);
                const isAdmin = user?.uid === group.createdBy;
                return (
                  <div key={m.id} className={styles.memberRow}>
                    <Avatar name={m.name} size="md" id={m.id} />
                    <span className={styles.memberRowName}>{m.name}</span>
                    {isAdmin && (
                      <button
                        className={`${styles.memberRemoveBtn} ${isInExpense ? styles.memberRemoveBtnDisabled : ""}`}
                        aria-label={isInExpense ? `${m.name} no se puede quitar` : `Quitar a ${m.name}`}
                        disabled={isInExpense}
                        onClick={() => !isInExpense && setDeleteMemberId(m.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {user?.uid === group.createdBy && (
              <Button variant="secondary" size="sm" onClick={() => setShowAddMember(true)}>
                <Plus size={14} /> Añadir miembro
              </Button>
            )}
          </section>

          <hr className={styles.settingsDivider} />

          {/* Section 3: Notificaciones */}
          <section className={styles.settingsSection}>
            <h3 className={styles.settingsSectionTitle}>🔔 Notificaciones</h3>
            <div className={styles.notifRow}>
              <span className={styles.notifLabel}>Notificaciones push</span>
              <button
                className={`${styles.notifToggle} ${notifsOn ? styles.notifToggleOn : ""}`}
                onClick={toggleNotifs}
                role="switch"
                aria-checked={notifsOn}
              >
                <span className={styles.notifToggleKnob} />
              </button>
            </div>
          </section>

          <hr className={styles.settingsDivider} />

          {/* Section 4: Zona peligrosa */}
          <section className={styles.settingsSection}>
            <h3 className={styles.settingsSectionTitle}>☠️ Zona peligrosa</h3>
            {user?.uid === group.createdBy ? (
              <Button
                size="md"
                variant="ghost"
                onClick={() => { setShowSettings(false); setShowDeleteGroup(true); }}
                style={{ width: "100%", color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}
              >
                <Trash2 size={16} />
                Eliminar grupo
              </Button>
            ) : (
              <Button
                size="md"
                variant="ghost"
                onClick={() => { setShowSettings(false); setShowLeaveGroup(true); }}
                style={{ width: "100%", color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}
              >
                <LogOut size={16} />
                Salir del grupo
              </Button>
            )}
          </section>
        </div>
      </Modal>

      {/* Add member modal (inside settings) */}
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

      <ConfirmDialog
        open={!!deleteExpenseId}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={() => { if (deleteExpenseId) { remove(deleteExpenseId, user?.uid, currentMemberName); showToast("Gasto eliminado", "success"); } }}
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

      <ConfirmDialog
        open={showLeaveGroup}
        onClose={() => setShowLeaveGroup(false)}
        onConfirm={async () => {
          await leaveGroup();
          showToast("Has salido del grupo", "success");
          navigate("/dashboard", { replace: true });
        }}
        title="¿Salir del grupo?"
        message="Tus gastos anteriores se conservarán en el historial, pero dejarás de ver el grupo. Si el creador te invita de nuevo, podrás volver a unirte."
        confirmLabel="Salir del grupo"
        variant="danger"
      />

      <Modal open={showClaimModal} onClose={() => setShowClaimModal(false)} title="¿Quién eres?">
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 14, textAlign: "center" }}>
          Selecciona tu nombre en este grupo
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {group.members.filter((m) => !m.userId).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleClaim(m.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: 12, border: "1.5px solid #E5E7EB",
                borderRadius: 12, background: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 500,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#07819C")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
            >
              <Avatar name={m.name} size="sm" id={m.id} />
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Floating Action Button */}
      <button
        className={styles.fab}
        onClick={() => navigate(`/group/${groupId}/expense/new`)}
        aria-label="Añadir gasto"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
