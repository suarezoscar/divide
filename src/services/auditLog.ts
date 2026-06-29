import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export type EventType =
  | "expense_created"
  | "expense_updated"
  | "expense_deleted"
  | "settlement_created"
  | "member_added"
  | "member_removed"
  | "member_left"
  | "member_claimed"
  | "group_created"
  | "group_deleted";

export interface EventDetails {
  expenseId?: string;
  expenseDescription?: string;
  amount?: number;
  memberId?: string;
  memberName?: string;
  [key: string]: unknown;
}

/** Write an audit log entry. Non-critical — fire-and-forget. */
export async function logEvent(
  groupId: string,
  type: EventType,
  actorUserId: string,
  actorName: string,
  details?: EventDetails
): Promise<void> {
  try {
    await addDoc(collection(db, "auditLog"), {
      groupId,
      type,
      actorUserId,
      actorName,
      timestamp: Timestamp.now(),
      details: details ?? null,
    });
  } catch {
    // Audit log is best-effort; never throw
  }
}
