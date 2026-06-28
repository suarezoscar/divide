import { memo } from "react";
import { getMemberColor } from "../../utils/memberColor";
import styles from "./Avatar.module.css";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  id?: string;
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

export const Avatar = memo(function Avatar({ name, size = "md", id }: AvatarProps) {
  return (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      style={{ background: getMemberColor(id ?? name) }}
      title={name}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
});
