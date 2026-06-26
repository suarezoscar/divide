import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGroup } from "../hooks/useGroups";
import { useExpenses } from "../hooks/useExpenses";
import { useBalances } from "../hooks/useBalances";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { BalanceSummary } from "../components/balances/BalanceSummary";
import { SettlementList } from "../components/balances/SettlementList";
import { Plus, Receipt, Users, ArrowRightLeft } from "lucide-react";
import { formatCurrency, formatDate } from "../utils/format";
import type { Member } from "../types";
import styles from "./GroupDetailPage.module.css";

type Tab = "expenses" | "balances" | "members";

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { group, loading, updateMembers } = useGroup(groupId!);
  const { expenses, loading: expLoading, remove } = useExpenses(groupId!);
  const [tab, setTab] = useState<Tab>("expenses");

  // Member name map for balance calculations
  const memberNames = new Map<string, string>();
  group?.members.forEach((m) => memberNames.set(m.id, m.name));

  const { balances, debts, addSettlement } = useBalances(groupId!, expenses, memberNames);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");

  const handleAddMember = async () => {
    if (!group || !newMemberName.trim()) return;
    const updated: Member[] = [
      ...group.members,
      { id: crypto.randomUUID(), name: newMemberName.trim() },
    ];
    await updateMembers(updated);
    setNewMemberName("");
    setShowAddMember(false);
  };

  if (loading) {
    return <p style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Cargando…</p>;
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
        <Button size="sm" onClick={() => navigate(`/group/${groupId}/expense/new`)}>
          <Plus size={16} />
          Añadir gasto
        </Button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.key}
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
            <p className={styles.muted}>Cargando gastos…</p>
          ) : expenses.length === 0 ? (
            <Card className={styles.empty}>
              <p>Aún no hay gastos. ¡Añade el primero!</p>
            </Card>
          ) : (
            <div className={styles.expenseList}>
              {(() => {
                const memberById = new Map(group.members.map((m) => [m.id, m]));
                return expenses.map((exp) => {
                const payer = memberById.get(exp.paidBy);
                return (
                  <Card key={exp.id} className={styles.expenseCard}>
                    <div className={styles.expenseRow}>
                      <div className={styles.expenseInfo}>
                        <p className={styles.expenseDesc}>{exp.description}</p>
                        <p className={styles.expenseMeta}>
                          Pagado por {payer?.name ?? exp.paidBy} · {formatDate(exp.date)}
                        </p>
                      </div>
                      <div className={styles.expenseRight}>
                        <span className={styles.expenseAmount}>{formatCurrency(exp.amount)}</span>
                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("¿Eliminar este gasto?")) remove(exp.id);
                          }}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className={styles.splits}>
                      {exp.splits.map((s) => {
                        const member = memberById.get(s.memberId);
                        return (
                          <div key={s.memberId} className={styles.splitRow}>
                            <Avatar name={member?.name ?? s.memberId} size="sm" />
                            <span>{member?.name ?? s.memberId}</span>
                            <span className={styles.splitAmount}>{formatCurrency(s.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })})()}
            </div>
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
    </div>
  );
}
