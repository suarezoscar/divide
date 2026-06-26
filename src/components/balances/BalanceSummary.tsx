import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { memo, useMemo } from "react";
import { formatCurrency } from "../../utils/format";
import type { MemberBalance } from "../../types";
import styles from "./BalanceSummary.module.css";

interface Props {
  balances: MemberBalance[];
}

export const BalanceSummary = memo(function BalanceSummary({ balances }: Props) {
  const sorted = useMemo(() => [...balances].sort((a, b) => a.balance - b.balance), [balances]);

  if (balances.length === 0) {
    return (
      <Card className={styles.empty}>
        <p>Aún no hay balances que mostrar</p>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <h2 className={styles.title}>Resumen de balances</h2>
      <div className={styles.list}>
        {sorted.map((b) => {
          const isPositive = b.balance >= 0;
          return (
            <div key={b.memberId} className={styles.row}>
              <Avatar name={b.memberName} size="sm" />
              <span className={styles.name}>{b.memberName}</span>
              <span className={`${styles.amount} ${isPositive ? styles.positive : styles.negative}`}>
                {formatCurrency(b.balance, true)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
});
