import { Timestamp } from "firebase/firestore";

export type EventType =
  | "expense_created"
  | "expense_updated"
  | "expense_deleted"
  | "settlement_created";

export interface AuditEntry {
  groupId: string;
  type: EventType;
  timestamp: Timestamp;
  actorName: string;
  amount: number;
  description?: string;
  toName?: string;
}
