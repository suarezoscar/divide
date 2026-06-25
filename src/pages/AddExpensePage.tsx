import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const [paidBy, setPaidBy] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("even");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (group && group.members.length > 0) {
      setPaidBy(group.members[0].id);
    }
  }, [group]);

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

    let splits: Split[];

    if (splitMode === "even") {
      const memberCount = group.members.length;
      const splitAmount = Math.round((numAmount / memberCount) * 100) / 100;
      // Handle rounding: give the remainder to the first member
      const remainder = Math.round((numAmount - splitAmount * (memberCount - 1)) * 100) / 100;
      splits = group.members.map((m, i) => ({
        memberId: m.id,
        amount: i === 0 ? remainder : splitAmount,
      }));
    } else {
      // Custom split
      const customAmounts = group.members.map((m) => parseFloat(customSplits[m.id] || "0"));
      const totalCustom = customAmounts.reduce((s, v) => s + v, 0);
      if (Math.abs(totalCustom - numAmount) > 0.01) {
        setError(`La suma de los splits (${totalCustom.toFixed(2)}) debe ser igual al total (${numAmount.toFixed(2)})`);
        return;
      }
      splits = group.members.map((m, i) => ({
        memberId: m.id,
        amount: customAmounts[i],
      }));
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

  const totalCustom = group.members.reduce(
    (s, m) => s + parseFloat(customSplits[m.id] || "0"),
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
            {group.members.map((m) => {
              const evenAmount =
                splitMode === "even"
                  ? (() => {
                      const memberCount = group.members.length;
                      const splitAmount = Math.round((parseFloat(amount || "0") / memberCount) * 100) / 100;
                      return isNaN(splitAmount) ? "—" : splitAmount.toFixed(2);
                    })()
                  : null;

              return (
                <div key={m.id} className={styles.splitRow}>
                  <Avatar name={m.name} size="sm" />
                  <span className={styles.splitMemberName}>{m.name}</span>
                  {splitMode === "even" ? (
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
