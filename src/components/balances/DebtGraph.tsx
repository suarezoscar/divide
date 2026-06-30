import { useMemo } from "react";
import { formatCurrency } from "../../utils/format";
import { getMemberColor } from "../../utils/memberColor";
import { Card } from "../ui/Card";
import type { DebtEdge, Member } from "../../types";
import styles from "./DebtGraph.module.css";

interface Props {
  debts: DebtEdge[];
  members: Member[];
}

/** Node position on the circle. */
interface NodePos {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

/** Raw edge for rendering (start/end in SVG coords). */
interface RenderEdge {
  from: string;
  to: string;
  amount: number;
  label: string;
  color: string;
  path: string; // SVG path data for the arc
  labelX: number;
  labelY: number;
}

const RADIUS = 90;       // circle radius for member positions
const CENTER = 140;      // center of 280×280 viewBox
const NODE_R = 22;       // visual radius of each member dot
const VIEW_SIZE = 280;

export function DebtGraph({ debts, members }: Props) {
  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  // Collect all unique member ids involved in debts
  const involvedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const d of debts) {
      ids.add(d.from);
      ids.add(d.to);
    }
    return Array.from(ids);
  }, [debts]);

  // Compute positions in a circle (top-start)
  const positions = useMemo<Map<string, NodePos>>(() => {
    const posMap = new Map<string, NodePos>();
    if (involvedIds.length === 0) return posMap;
    const N = involvedIds.length;
    for (let i = 0; i < N; i++) {
      const id = involvedIds[i];
      const angle = (2 * Math.PI * i) / N - Math.PI / 2;
      const m = memberById.get(id);
      posMap.set(id, {
        id,
        name: m?.name ?? id,
        x: CENTER + RADIUS * Math.cos(angle),
        y: CENTER + RADIUS * Math.sin(angle),
        color: getMemberColor(id),
      });
    }
    return posMap;
  }, [involvedIds, memberById]);

  // Build render edges with arc paths
  const edges = useMemo<RenderEdge[]>(() => {
    if (positions.size < 2) return [];
    return debts.map((d) => {
      const fromPos = positions.get(d.from);
      const toPos = positions.get(d.to);
      if (!fromPos || !toPos) return null;

      // Distance and mid-point
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const mx = (fromPos.x + toPos.x) / 2;
      const my = (fromPos.y + toPos.y) / 2;

      // Control point offset perpendicular to the chord, outward
      // Scale by how far the nodes are (closer = more arc)
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offset = Math.max(12, 30 - dist * 0.15);
      // Perpendicular direction (normalized)
      const nx = -dy / dist;
      const ny = dx / dist;
      const cx = mx + nx * offset;
      const cy = my + ny * offset;

      // Path: quadratic bezier from → via control → to
      const path = `M ${fromPos.x} ${fromPos.y} Q ${cx} ${cy} ${toPos.x} ${toPos.y}`;

      // Label near the control point
      const labelX = cx + nx * 12;
      const labelY = cy + ny * 12;

      return {
        from: d.from,
        to: d.to,
        amount: d.amount,
        label: formatCurrency(d.amount),
        color: fromPos.color,
        path,
        labelX,
        labelY,
      };
    }).filter(Boolean) as RenderEdge[];
  }, [debts, positions]);

  if (debts.length === 0 || positions.size < 2) return null;

  return (
    <Card className={styles.card}>
      <h3 className={styles.heading}>Grafo de deudas</h3>
      <div className={styles.graphContainer}>
        <svg
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
          className={styles.graph}
          role="img"
          aria-label="Gráfico de deudas entre miembros"
        >
          {/* Edges (arrows) */}
          {edges.map((e, i) => (
            <g key={`edge-${i}`}>
              {/* Arrow line */}
              <path
                d={e.path}
                fill="none"
                stroke={e.color}
                strokeWidth={2}
                markerEnd={`url(#arrowhead-${i})`}
                className={styles.edgePath}
              />
              {/* Arrowhead marker */}
              <defs>
                <marker
                  id={`arrowhead-${i}`}
                  viewBox="0 0 10 10"
                  refX={9}
                  refY={5}
                  markerWidth={6}
                  markerHeight={6}
                  orient="auto"
                >
                  <polygon points="0 0, 10 5, 0 10" fill={e.color} />
                </marker>
              </defs>
              {/* Amount label */}
              <text
                x={e.labelX}
                y={e.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className={styles.edgeLabel}
              >
                {e.label}
              </text>
            </g>
          ))}

          {/* Nodes (members) */}
          {Array.from(positions.values()).map((pos) => (
            <g key={`node-${pos.id}`}>
              <circle cx={pos.x} cy={pos.y} r={NODE_R} fill={pos.color} className={styles.node} />
              <text
                x={pos.x}
                y={pos.y - 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className={styles.nodeInitial}
              >
                {pos.name.charAt(0).toUpperCase()}
              </text>
              <text
                x={pos.x}
                y={pos.y + NODE_R + 12}
                textAnchor="middle"
                className={styles.nodeName}
              >
                {pos.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </Card>
  );
}
