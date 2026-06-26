import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGroup } from "../hooks/useGroups";
import { useExpenses } from "../hooks/useExpenses";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Avatar } from "../components/ui/Avatar";
import type { Split } from "../types";
import styles from "./AddExpensePage.module.css";

type SplitMode = "even" | "custom";

export function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { group, loading } = useGroup(groupId!);
  const { add } = useExpenses(groupId!);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(() => group?.members[0]?.id ?? "");
  const [splitMode, setSplitMode] = useState<SplitMode>("even");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [includedMembers, setIncludedMembers] = useState<Set<string>>(
    () => new Set(group?.members.map((m) => m.id) ?? [])
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <p style={{ textAlign: "center", padding: 40 }}>Cargando…</p>;
  if (!group) return <p style={{ textAlign: "center", padding: 40, color: "#EF4444" }}>Grupo no encontrado</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      setError("Completa todos los campos");
      return;
    }

    if (includedMembers.size < 1) {
      setError("Al menos un miembro debe participar en el gasto");
      return;
    }
    if (!includedMembers.has(paidBy)) {
      setError("El pagador debe estar incluido en el gasto");
      return;
    }

    let splits: Split[];

    if (splitMode === "even") {
      const count = includedMembers.size;
      const splitAmount = Math.round((numAmount / count) * 100) / 100;
      const remaining = Math.round((numAmount - splitAmount * (count - 1)) * 100) / 100;
      const memberIds = [...includedMembers];
      splits = memberIds.map((memberId, i) => ({
        memberId,
        amount: i === 0 ? remaining : splitAmount,
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
      await add(description.trim(), numAmount, paidBy, splits);
      navigate(`/group/${groupId}`);
    } catch {
      setError("Error al guardar el gasto");
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

  const toggleAllMembers = () => {
    if (!group) return;
    const allIds = group.members.map((m) => m.id);
    const allIncluded = allIds.every((id) => includedMembers.has(id));
    if (allIncluded) {
      setIncludedMembers(new Set([paidBy]));
    } else {
      setIncludedMembers(new Set(allIds));
    }
  };

  const totalCustom = [...includedMembers].reduce(
    (s, id) => s + parseFloat(customSplits[id] || "0"),
    0
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Nuevo gasto</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Card className={styles.card}>
          <Input
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cena en el italiano"
          />

          <Input
            label="Importe total"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />

          <div className={styles.field}>
            <label className={styles.label}>Pagado por</label>
            <div className={styles.payerList}>
              {group.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`${styles.payerBtn} ${paidBy === m.id ? styles.payerActive : ""}`}
                  onClick={() => setPaidBy(m.id)}
                >
                  <Avatar name={m.name} size="sm" />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Split mode */}
        <Card className={styles.card}>
          <div className={styles.splitHeader}>
            <h3>División del gasto</h3>
            <div className={styles.splitToggle}>
              <button
                type="button"
                className={`${styles.splitToggleBtn} ${splitMode === "even" ? styles.splitToggleActive : ""}`}
                onClick={() => setSplitMode("even")}
              >
                Equitativo
              </button>
              <button
                type="button"
                className={`${styles.splitToggleBtn} ${splitMode === "custom" ? styles.splitToggleActive : ""}`}
                onClick={() => setSplitMode("custom")}
              >
                Personalizado
              </button>
            </div>
          </div>

          <div className={styles.splitList}>
            <button type="button" className={styles.toggleAll} onClick={toggleAllMembers}>
              {group.members.every((m) => includedMembers.has(m.id))
                ? "Excluir todos"
                : "Incluir todos"}
            </button>

            {group.members.map((m) => {
              const isIncluded = includedMembers.has(m.id);
              const evenAmount =
                splitMode === "even" && isIncluded
                  ? (() => {
                      const count = includedMembers.size;
                      const val = parseFloat(amount || "0");
                      const sa = Math.round((val / count) * 100) / 100;
                      return isNaN(sa) ? "—" : sa.toFixed(2);
                    })()
                  : null;

              return (
                <div
                  key={m.id}
                  className={`${styles.splitRow} ${!isIncluded ? styles.splitExcluded : ""}`}
                >
                  <button
                    type="button"
                    className={`${styles.checkbox} ${isIncluded ? styles.checkboxChecked : ""}`}
                    onClick={() => toggleMember(m.id)}
                  >
                    {isIncluded && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <Avatar name={m.name} size="sm" />
                  <span className={styles.splitMemberName}>{m.name}</span>
                  {!isIncluded ? (
                    <span className={styles.excludedLabel}>Excluido</span>
                  ) : splitMode === "even" ? (
                    <span className={styles.splitValue}>{evenAmount}</span>
                  ) : (
                    <input
                      type="number"
                      className={styles.splitInput}
                      value={customSplits[m.id] || ""}
                      onChange={(e) => updateCustomSplit(m.id, e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {splitMode === "custom" && (
            <div className={styles.customTotal}>
              Total splits: <strong>{totalCustom.toFixed(2)}</strong>
              {Math.abs(totalCustom - parseFloat(amount || "0")) > 0.01 && (
                <span className={styles.splitMismatch}> (no coincide)</span>
              )}
            </div>
          )}
        </Card>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? "Guardando…" : "Guardar gasto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
