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
import { eur, splitEvenCents, equal } from "../utils/money";
import styles from "./AddExpensePage.module.css";

type SplitMode = "even" | "custom";

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
  const [splitMode, setSplitMode] = useState<SplitMode>("even");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Auto-select linked member as payer (new expenses only)
  useEffect(() => {
    if (isEditing) return;
    if (!group) return;
    if (linkedMemberId) {
      setPaidBy(linkedMemberId);
    } else if (group.members.length > 0 && !paidBy) {
      setPaidBy(group.members[0].id);
    }
  }, [linkedMemberId, group?.id, isEditing]);
  const [error, setError] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseTime, setExpenseTime] = useState("");
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
      if (exp.splits.length > 0) {
        const firstAmount = exp.splits[0].amount;
        const allEven = exp.splits.every((s) => equal(eur(s.amount), eur(firstAmount)))
          || exp.splits.length === 1;
        if (allEven) {
          setSplitMode("even");
        } else {
          setSplitMode("custom");
          const custom: Record<string, string> = {};
          for (const s of exp.splits) {
            custom[s.memberId] = String(s.amount).replace(".", ",");
          }
          setCustomSplits(custom);
        }
      }
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

    let splits: Split[];

    if (splitMode === "even") {
      const memberIds = [...includedMembers];
      const amounts = splitEvenCents(numAmount, memberIds.length);
      splits = memberIds.map((memberId, i) => ({
        memberId,
        amount: amounts[i],
      }));
    } else {
      const customAmounts: Split[] = [];
      for (const id of includedMembers) {
        const val = parseFloat(customSplits[id] || "0");
        customAmounts.push({ memberId: id, amount: val });
      }
      const totalCustom = customAmounts.reduce((s, v) => s + v.amount, 0);
      if (Math.abs(totalCustom - numAmount) > 0.01) {
        setError(`La suma de los splits (${totalCustom.toFixed(2)}) debe ser igual al total (${numAmount.toFixed(2)})`);
        return;
      }
      splits = customAmounts;
    }

    setSubmitting(true);
    try {
      const date = expenseDate
        ? new Date(`${expenseDate}T${expenseTime || "12:00"}`)
        : undefined;
      const cat = category || undefined;
      if (isEditing) {
        await update(expenseId!, description.trim(), numAmount, paidBy, splits, date, cat);
        showToast("Gasto actualizado", "success");
      } else {
        const created = await add(description.trim(), numAmount, paidBy, splits, date, cat, user?.uid);
        sessionStorage.setItem(`lastAdded-${groupId}`, created.id);
        showToast("Gasto añadido", "success");
      }
      navigate(`/group/${groupId}`);
    } catch {
      setError(friendlyError("Error al guardar"));
      setSubmitting(false);
    }
  };

  const updateCustomSplit = (memberId: string, value: string) => {
    setCustomSplits((prev) => ({ ...prev, [memberId]: value }));
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

  const totalCustom = [...includedMembers].reduce(
    (s, id) => s + parseFloat(customSplits[id] || "0"),
    0
  );
  const effectiveAmount = parseFloat((amount || "0").replace(",", "."));

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{isEditing ? "Editar gasto" : "Nuevo gasto"}</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
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

          <Input
            label="Importe total"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />

          <div className={styles.field}>
            <label className={styles.label}>Fecha (opcional)</label>
            <div className={styles.dateRow}>
              <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
              <Input type="time" value={expenseTime} onChange={(e) => setExpenseTime(e.target.value)} />
            </div>
          </div>

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
        </Card>

        {/* Split mode */}
        <Card className={styles.card}>
          <div className={styles.splitHeader}>
            <h2>División del gasto</h2>
            <div className={styles.splitToggle}>
              <button
                type="button"
                aria-pressed={splitMode === "even"}
                className={`${styles.splitToggleBtn} ${splitMode === "even" ? styles.splitToggleActive : ""}`}
                onClick={() => setSplitMode("even")}
              >
                Equitativo
              </button>
              <button
                type="button"
                aria-pressed={splitMode === "custom"}
                className={`${styles.splitToggleBtn} ${splitMode === "custom" ? styles.splitToggleActive : ""}`}
                onClick={() => setSplitMode("custom")}
              >
                Personalizado
              </button>
            </div>
          </div>

          <div className={styles.splitList}>
            {(() => {
              const splitMap = new Map<string, number>();
              if (splitMode === "even" && includedMembers.size > 0 && !isNaN(effectiveAmount) && effectiveAmount > 0) {
                const memberIds = [...includedMembers];
                const amounts = splitEvenCents(effectiveAmount, memberIds.length);
                memberIds.forEach((id, i) => splitMap.set(id, amounts[i]));
              }

              return group.members.map((m) => {
              const isIncluded = includedMembers.has(m.id);
              const evenAmount =
                splitMode === "even" && isIncluded
                  ? (() => {
                      const sa = splitMap.get(m.id);
                      return sa !== undefined && !isNaN(sa) ? sa.toFixed(2) : "—";
                    })()
                  : null;

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
                    ) : splitMode === "even" ? (
                      <span className={styles.splitValue}>{evenAmount}</span>
                    ) : (
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        className={styles.splitInput}
                        value={customSplits[m.id] || ""}
                        onChange={(e) => updateCustomSplit(m.id, e.target.value)}
                        placeholder="0.00"
                      />
                    )}
                  </div>
                </div>
              );
            })})()}
          </div>

          {splitMode === "custom" && (
            <div className={styles.customTotal}>
              Total splits: <strong>{totalCustom.toFixed(2)}</strong>
              {Math.abs(totalCustom - effectiveAmount) > 0.01 && (
                <span className={styles.splitMismatch}> (no coincide)</span>
              )}
            </div>
          )}
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
