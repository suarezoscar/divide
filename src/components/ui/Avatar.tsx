import { memo } from "react";
import styles from "./Avatar.module.css";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const COLORS = [
  "#07819C", "#E57373", "#64B5F6", "#81C784",
  "#FFB74D", "#BA68C8", "#4DB6AC", "#F06292",
];

function hashColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const Avatar = memo(function Avatar({ name, size = "md" }: AvatarProps) {
  return (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      style={{ background: hashColor(name) }}
      title={name}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
});
