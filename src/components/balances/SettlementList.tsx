import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { memo, useState, useMemo } from "react";
import { formatCurrency } from "../../utils/format";
import type { DebtEdge, Member } from "../../types";
import { ArrowRight, Check, CircleCheckBig } from "lucide-react";
import styles from "./SettlementList.module.css";

interface Props {
  debts: DebtEdge[];
  members: Member[];
  onSettle: (from: string, to: string, amount: number) => Promise<void>;
}

export const SettlementList = memo(function SettlementList({ debts, members, onSettle }: Props) {
  const [settling, setSettling] = useState<string | null>(null);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  if (debts.length === 0) {
    return (
      <Card className={styles.empty}>
        <CircleCheckBig size={28} color="#059669" />
        <p>Sin deudas pendientes</p>
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
      <h2 className={styles.title}>Pagos necesarios</h2>
      <div className={styles.list}>
        {debts.map((d) => {
          const key = `${d.from}-${d.to}`;
          const fromMember = memberById.get(d.from);
          const toMember = memberById.get(d.to);

          return (
            <div key={`${d.from}-${d.to}`} className={styles.debtRow}>
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
        })}
      </div>
    </Card>
  );
});
