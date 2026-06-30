import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGroup } from "../hooks/useGroups";
import { useExpenses } from "../hooks/useExpenses";
import { useAuth } from "../hooks/useAuth";
import * as expensesService from "../services/expenses";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Avatar } from "../components/ui/Avatar";
import { CATEGORIES } from "../utils/categories";
import { detectCategory } from "../utils/categoryDetection";
import { showToast } from "../components/ui/Toast";
import { friendlyError } from "../utils/errors";
import { Skeleton } from "../components/ui/Skeleton";
import type { Split } from "../types";
import { splitEvenCents } from "../utils/money";
import styles from "./AddExpensePage.module.css";

export function AddExpensePage() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId?: string }>();
  const navigate = useNavigate();
  const { group, loading, linkedMemberId } = useGroup(groupId!);
  const { add, update } = useExpenses(groupId!);
  const { user } = useAuth();
  const isEditing = !!expenseId;

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-select linked member as payer (new expenses only)
  const [showPayerPicker, setShowPayerPicker] = useState(false);
  useEffect(() => {
    if (isEditing) return;
    if (!group) return;
    if (linkedMemberId) {
      setPaidBy(linkedMemberId);
      setShowPayerPicker(false);
    } else if (group.members.length > 0 && !paidBy) {
      setPaidBy(group.members[0].id);
      setShowPayerPicker(true);
    }
  }, [linkedMemberId, group?.id, isEditing]);
  const currentMemberName = group?.members.find((m) => m.userId === user?.uid)?.name;
  const [error, setError] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseTime, setExpenseTime] = useState("");
  const [showDate, setShowDate] = useState(isEditing);
  const [category, setCategory] = useState("other");
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const [includedMembers, setIncludedMembers] = useState<Set<string>>(new Set());

  // Auto-init: all members included by default (only for new expenses)
  useEffect(() => {
    if (isEditing) return;
    if (group && group.members.length > 0) {
      setIncludedMembers(new Set(group.members.map((m) => m.id)));
    }
  }, [group?.id, isEditing]);

  // Load existing expense for edit mode
  useEffect(() => {
    if (!expenseId || !group) return;
    expensesService.getExpense(expenseId).then((exp) => {
      if (!exp || exp.groupId !== groupId) return;
      setDescription(exp.description);
      setAmount(String(exp.amount).replace(".", ","));
      setPaidBy(exp.paidBy);
      const d = exp.date.toDate();
      setExpenseDate(d.toISOString().slice(0, 10));
      setExpenseTime(d.toTimeString().slice(0, 5));
      setCategory(exp.category ?? "other");
      setCategoryManuallySet(true);
      setIncludedMembers(new Set(exp.splits.map((s) => s.memberId)));
    });
  }, [expenseId, group, groupId]);

  if (loading) return (
    <div style={{ padding: 20, maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <Skeleton width="200px" height="28px" />
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 16 }}>
        <Skeleton width="100px" height="14px" />
        <Skeleton width="100%" height="44px" />
        <Skeleton width="80px" height="14px" />
        <Skeleton width="100%" height="44px" />
      </div>
    </div>
  );
  if (!group) return <p style={{ textAlign: "center", padding: 40, color: "#DC2626" }}>Grupo no encontrado</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount.replace(",", "."));
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      setError("Falta la descripción o el importe no es válido");
      return;
    }

    if (includedMembers.size < 1) {
      setError("Al menos un miembro debe participar en el gasto");
      return;
    }

    const memberIds = [...includedMembers];
    const amounts = splitEvenCents(numAmount, memberIds.length);
    const splits: Split[] = memberIds.map((memberId, i) => ({
      memberId,
      amount: amounts[i],
    }));

    setSubmitting(true);
    try {
      const date = expenseDate
        ? new Date(`${expenseDate}T${expenseTime || "12:00"}`)
        : undefined;
      const cat = category || undefined;
      if (isEditing) {
        await update(expenseId!, description.trim(), numAmount, paidBy, splits, date, cat, user?.uid, currentMemberName);
        showToast("Gasto actualizado", "success");
      } else {
        const created = await add(description.trim(), numAmount, paidBy, splits, date, cat, user?.uid, currentMemberName);
        sessionStorage.setItem(`lastAdded-${groupId}`, created.id);
        showToast("Gasto añadido", "success");
      }
      navigate(`/group/${groupId}`);
    } catch {
      setError(friendlyError("Error al guardar"));
      setSubmitting(false);
    }
  };

  const toggleMember = (id: string) => {
    setIncludedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev;
        next.delete(id);
        if (paidBy === id) {
          const remaining = [...next][0];
          setPaidBy(remaining);
        }
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const effectiveAmount = parseFloat((amount || "0").replace(",", "."));

  // Precompute split amounts for display
  const splitAmounts = (() => {
    const map = new Map<string, string>();
    if (includedMembers.size > 0 && !isNaN(effectiveAmount) && effectiveAmount > 0) {
      const memberIds = [...includedMembers];
      const amounts = splitEvenCents(effectiveAmount, memberIds.length);
      memberIds.forEach((id, i) => map.set(id, amounts[i].toFixed(2)));
    }
    return map;
  })();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{isEditing ? "Editar gasto" : "Nuevo gasto"}</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Fields + payer */}
        <Card className={styles.card}>
          <Input
            label="Descripción"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (!categoryManuallySet) {
                const detected = detectCategory(e.target.value);
                setCategory(detected ?? "other");
              }
              if (!e.target.value.trim()) {
                setCategory("other");
                setCategoryManuallySet(false);
              }
            }}
            placeholder="Cena en el italiano"
          />

          <div className={styles.field}>
            <label className={styles.label}>Categoría</label>
            <div className={styles.categoryList}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.categoryChip} ${category === c.id ? styles.categoryActive : ""}`}
                  onClick={() => { setCategory(c.id); setCategoryManuallySet(true); }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Importe total"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />

          {/* Payer — collapsible when auto-selected */}
          {showPayerPicker || isEditing ? (
            <div className={styles.field}>
              <label className={styles.label}>¿Quién pagó?</label>
              <div className={styles.payerList}>
                {group.members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`${styles.payerBtn} ${paidBy === m.id ? styles.payerActive : ""}`}
                    onClick={() => setPaidBy(m.id)}
                  >
                    <Avatar name={m.name} size="sm" id={m.id} />
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.payerCompact}>
              <span className={styles.payingLabel}>
                Pagando:{" "}
                <Avatar name={group.members.find((m) => m.id === paidBy)?.name ?? ""} size="sm" id={paidBy} />
                <span>{group.members.find((m) => m.id === paidBy)?.name ?? ""}</span>
              </span>
              <button type="button" className={styles.toggleLink} onClick={() => setShowPayerPicker(true)}>
                (cambiar)
              </button>
            </div>
          )}
        </Card>

        {/* Date (collapsed) + split */}
        <Card className={styles.card}>
          {!showDate ? (
            <button type="button" className={styles.toggleLinkCentered} onClick={() => setShowDate(true)}>
              + Añadir fecha
            </button>
          ) : (
            <div className={styles.field}>
              <div className={styles.dateHeader}>
                <label className={styles.label}>Fecha</label>
                <button
                  type="button"
                  className={styles.toggleLink}
                  onClick={() => { setShowDate(false); setExpenseDate(""); setExpenseTime(""); }}
                >
                  Quitar
                </button>
              </div>
              <div className={styles.dateRow}>
                <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
                <Input type="time" value={expenseTime} onChange={(e) => setExpenseTime(e.target.value)} />
              </div>
            </div>
          )}

          {/* Split — always even */}
          <h2 className={styles.splitTitle}>Reparto equitativo</h2>

          <div className={styles.splitList}>
            {group.members.map((m) => {
              const isIncluded = includedMembers.has(m.id);
              const amountStr = splitAmounts.get(m.id);

              return (
                <div
                  key={m.id}
                  className={`${styles.splitRowCard} ${!isIncluded ? styles.splitRowExcluded : ""}`}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isIncluded}
                    className={`${styles.checkbox} ${isIncluded ? styles.checkboxChecked : ""}`}
                    onClick={() => toggleMember(m.id)}
                  >
                    {isIncluded && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <div className={styles.splitRowContent}>
                    <div className={styles.splitMemberInfo}>
                      <Avatar name={m.name} size="sm" id={m.id} />
                      <span className={`${styles.splitMemberName} ${!isIncluded ? styles.splitMemberExcluded : ""}`}>{m.name}</span>
                    </div>
                    {!isIncluded ? (
                      <span className={styles.excludedLabel}>Excluido</span>
                    ) : (
                      <span className={styles.splitValue}>{amountStr ?? "—"}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={submitting} size="lg">
            {isEditing ? "Actualizar gasto" : "Guardar gasto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
