import { formatCurrency } from "../../utils/format";
import { getMemberColor } from "../../utils/memberColor";
import { Card } from "../ui/Card";
import styles from "./ExpenseDonut.module.css";

interface Props {
  balances: { memberId: string; memberName: string; amount: number }[];
  total: number;
}

export function ExpenseDonut({ balances, total }: Props) {
  if (balances.length === 0 || total === 0) return null;

  const sorted = [...balances].sort((a, b) => b.amount - a.amount);
  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = sorted.map((b) => {
    const pct = b.amount / total;
    const dash = pct * circumference;
    const segment = { ...b, pct, dash, offset, color: getMemberColor(b.memberId) };
    offset += dash;
    return segment;
  });

  return (
    <Card className={styles.card}>
      <h3 className={styles.cardTitle}>Desglose</h3>
      <div className={styles.donutWrap}>
        <svg viewBox="0 0 160 160" className={styles.donut}>
          {segments.map((s, i) => (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={-s.offset}
              transform="rotate(-90 80 80)"
            />
          ))}
          <text x="80" y="76" textAnchor="middle" className={styles.donutTotal}>
            {formatCurrency(total)}
          </text>
          <text x="80" y="94" textAnchor="middle" className={styles.donutLabel}>
            total gastos
          </text>
        </svg>
        <div className={styles.legend}>
          {segments.map((s, i) => (
            <div key={i} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: s.color }} />
              <span className={styles.legendName}>{s.memberName}</span>
              <span className={styles.legendAmount}>{formatCurrency(s.amount)}</span>
              <span className={styles.legendPct}>{Math.round(s.pct * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
