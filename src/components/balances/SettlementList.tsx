import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { formatCurrency } from "../../utils/format";
import type { DebtEdge, Member } from "../../types";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import styles from "./SettlementList.module.css";

interface Props {
  debts: DebtEdge[];
  members: Member[];
  onSettle: (from: string, to: string, amount: number) => Promise<void>;
}

export function SettlementList({ debts, members, onSettle }: Props) {
  const [settling, setSettling] = useState<string | null>(null);

  if (debts.length === 0) {
    return (
      <Card className={styles.empty}>
        <p>Todo está saldado ✓</p>
      </Card>
    );
  }

  const handleSettle = async (debt: DebtEdge) => {
    setSettling(`${debt.from}-${debt.to}`);
    try {
      await onSettle(debt.from, debt.to, debt.amount);
    } finally {
      setSettling(null);
    }
  };

  return (
    <Card className={styles.card}>
      <h3 className={styles.title}>Pagos necesarios</h3>
      <div className={styles.list}>
        {(() => {
          const memberById = new Map(members.map((m) => [m.id, m]));
          return debts.map((d, i) => {
          const key = `${d.from}-${d.to}`;
          const fromMember = memberById.get(d.from);
          const toMember = memberById.get(d.to);

          return (
            <div key={i} className={styles.debtRow}>
              <div className={styles.debtMembers}>
                <div className={styles.member}>
                  <Avatar name={fromMember?.name ?? d.fromName} size="sm" />
                  <span>{fromMember?.name ?? d.fromName}</span>
                </div>
                <ArrowRight size={16} color="#9CA3AF" />
                <div className={styles.member}>
                  <Avatar name={toMember?.name ?? d.toName} size="sm" />
                  <span>{toMember?.name ?? d.toName}</span>
                </div>
              </div>
              <div className={styles.debtActions}>
                <span className={styles.debtAmount}>{formatCurrency(d.amount)}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSettle(d)}
                  disabled={settling === key}
                >
                  <Check size={14} />
                  {settling === key ? "…" : "Saldar"}
                </Button>
              </div>
            </div>
          );
        })})()}
      </div>
    </Card>
  );
}
