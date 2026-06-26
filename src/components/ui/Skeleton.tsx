import styles from "./Skeleton.module.css";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

export function Skeleton({ width: w = "100%", height: h = "20px", className = "", style, ...rest }: Props) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width: w, height: h, ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Skeleton width="140px" height="28px" />
        <Skeleton width="80px" height="32px" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.card}>
          <div>
            <Skeleton width="160px" height="16px" />
            <Skeleton width="200px" height="12px" style={{ marginTop: 6 }} />
          </div>
          <Skeleton width="80px" height="28px" />
        </div>
      ))}
    </div>
  );
}

export function GroupDetailSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Skeleton width="200px" height="28px" />
        <Skeleton width="120px" height="32px" />
      </div>
      <div style={{ display: "flex", gap: 4, background: "#E5E7EB", borderRadius: 14, padding: 4 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="80px" height="36px" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.expenseCard}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton width="180px" height="16px" />
            <Skeleton width="60px" height="16px" />
          </div>
          <Skeleton width="140px" height="12px" style={{ marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}
