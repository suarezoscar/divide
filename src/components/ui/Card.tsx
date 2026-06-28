import { memo } from "react";
import styles from "./Card.module.css";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
}

export const Card = memo(function Card({ children, className = "", onClick, style, ...rest }: CardProps) {
  const a11y = onClick
    ? {
        role: "button" as const,
        tabIndex: 0 as const,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ""} ${className}`}
      onClick={onClick}
      style={style}
      {...a11y}
      {...rest}
    >
      {children}
    </div>
  );
});
