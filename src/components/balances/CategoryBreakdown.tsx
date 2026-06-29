import { formatCurrency } from "../../utils/format";
import { getCategory, getCategoryColor } from "../../utils/categories";
import styles from "./CategoryBreakdown.module.css";

interface Props {
  items: { categoryId: string; amount: number }[];
  total: number;
}

export function CategoryBreakdown({ items, total }: Props) {
  if (items.length === 0 || total === 0) return null;

  const sorted = [...items].sort((a, b) => b.amount - a.amount);

  return (
    <div className={styles.scroll}>
      {sorted.map((item) => {
        const cat = getCategory(item.categoryId);
        const pct = item.amount / total;
        const color = getCategoryColor(item.categoryId);

        return (
          <div key={item.categoryId} className={styles.card}>
            <span className={styles.emoji}>{cat?.emoji ?? "📦"}</span>
            <span className={styles.name}>{cat?.label ?? "Otro"}</span>
            <span className={styles.amount}>{formatCurrency(item.amount)}</span>
            <div className={styles.barTrack}>
              <div
                className={styles.bar}
                style={{ width: `${Math.max(pct * 100, 2)}%`, background: color }}
              />
            </div>
            <span className={styles.pct}>{Math.round(pct * 100)}%</span>
          </div>
        );
      })}
    </div>
  );
}
