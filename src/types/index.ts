// ── Data models ──

import type { Timestamp } from "firebase/firestore";

export interface Member {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: Member[];
  userIds: string[];
  inviteCode?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Split {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string; // member id
  date: Timestamp;
  splits: Split[];
}

export interface Settlement {
  id: string;
  groupId: string;
  from: string; // member id (who pays)
  to: string; // member id (who receives)
  amount: number;
  date: Timestamp;
}

// ── Derived / UI types ──

export interface MemberBalance {
  memberId: string;
  memberName: string;
  paid: number;
  owed: number;
  balance: number; // positive = owed to them, negative = they owe
}

export interface DebtEdge {
  from: string; // member id
  fromName: string;
  to: string; // member id
  toName: string;
  amount: number;
}
