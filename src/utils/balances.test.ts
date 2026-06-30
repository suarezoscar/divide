import { describe, it, expect } from "vitest";
import { computeBalances, minimizeDebts } from "./balances";
import type { Expense, Settlement, MemberBalance } from "../types";

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    groupId: "g1",
    description: "Test",
    amount: 100,
    paidBy: "alice",
    date: { toMillis: () => 0 } as any,
    splits: [],
    ...overrides,
  };
}

function makeMemberNames(ids: string[]): Map<string, string> {
  return new Map(ids.map((id) => [id, id]));
}

describe("computeBalances", () => {
  it("returns empty array for no expenses", () => {
    const result = computeBalances([], [], makeMemberNames([]));
    expect(result).toEqual([]);
  });

  it("single expense, even split among 2", () => {
    const exp = makeExpense({
      amount: 100,
      paidBy: "alice",
      splits: [
        { memberId: "alice", amount: 50 },
        { memberId: "bob", amount: 50 },
      ],
    });
    const result = computeBalances([exp], [], makeMemberNames(["alice", "bob"]));
    // Alice paid 100, owes 50 → balance +50
    // Bob paid 0, owes 50 → balance -50
    const alice = result.find((b) => b.memberId === "alice")!;
    const bob = result.find((b) => b.memberId === "bob")!;
    expect(alice.balance).toBe(50);
    expect(bob.balance).toBe(-50);
  });

  it("handles settlement correctly", () => {
    const exp = makeExpense({
      amount: 100,
      paidBy: "alice",
      splits: [{ memberId: "bob", amount: 100 }],
    });
    const settlement: Settlement = {
      id: "s1",
      groupId: "g1",
      from: "bob",
      to: "alice",
      amount: 100,
      date: { toMillis: () => 1 } as any,
    };
    const result = computeBalances([exp], [settlement], makeMemberNames(["alice", "bob"]));
    const alice = result.find((b) => b.memberId === "alice")!;
    const bob = result.find((b) => b.memberId === "bob")!;
    expect(alice.balance).toBe(0);
    expect(bob.balance).toBe(0);
  });

  it("multi-payer expense", () => {
    const exp = makeExpense({
      amount: 100,
      paidBy: "alice",
      payers: [
        { memberId: "alice", amount: 60 },
        { memberId: "bob", amount: 40 },
      ],
      splits: [
        { memberId: "alice", amount: 33.33 },
        { memberId: "bob", amount: 33.33 },
        { memberId: "carol", amount: 33.34 },
      ],
    });
    const result = computeBalances([exp], [], makeMemberNames(["alice", "bob", "carol"]));
    const alice = result.find((b) => b.memberId === "alice")!;
    const bob = result.find((b) => b.memberId === "bob")!;
    const carol = result.find((b) => b.memberId === "carol")!;
    expect(Math.abs(alice.balance - 26.67)).toBeLessThan(0.01);
    expect(Math.abs(bob.balance - 6.67)).toBeLessThan(0.01);
    expect(Math.abs(carol.balance + 33.34)).toBeLessThan(0.01);
  });

  it("members with no transactions are not included in balances", () => {
    const exp = makeExpense({
      amount: 50,
      paidBy: "alice",
      splits: [{ memberId: "bob", amount: 50 }],
    });
    const result = computeBalances([exp], [], makeMemberNames(["alice", "bob", "carol"]));
    const carol = result.find((b) => b.memberId === "carol");
    expect(carol).toBeUndefined();
  });
});

describe("minimizeDebts", () => {
  it("returns empty for zero balances", () => {
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "A", paid: 0, owed: 0, balance: 0 },
      { memberId: "b", memberName: "B", paid: 0, owed: 0, balance: 0 },
    ];
    expect(minimizeDebts(balances)).toEqual([]);
  });

  it("single debtor to single creditor", () => {
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "Alice", paid: 100, owed: 0, balance: 100 },
      { memberId: "b", memberName: "Bob", paid: 0, owed: 100, balance: -100 },
    ];
    const debts = minimizeDebts(balances);
    expect(debts).toHaveLength(1);
    expect(debts[0]).toMatchObject({ from: "b", to: "a", amount: 100 });
  });

  it("minimizes transitive debts", () => {
    // A owes B 50, B owes C 50 → A should pay C 50 directly
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "A", paid: 0, owed: 50, balance: -50 },
      { memberId: "b", memberName: "B", paid: 50, owed: 50, balance: 0 },
      { memberId: "c", memberName: "C", paid: 50, owed: 0, balance: 50 },
    ];
    const debts = minimizeDebts(balances);
    expect(debts).toHaveLength(1);
    expect(debts[0].from).toBe("a");
    expect(debts[0].to).toBe("c");
    expect(debts[0].amount).toBe(50);
  });

  it("handles rounding with small decimals", () => {
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "A", paid: 0, owed: 33.33, balance: -33.33 },
      { memberId: "b", memberName: "B", paid: 33.34, owed: 0, balance: 33.34 },
    ];
    const debts = minimizeDebts(balances);
    expect(debts).toHaveLength(1);
    expect(debts[0].amount).toBe(33.33);
  });

  // ── Minimum transaction count proofs ──
  // The greedy max-debtor→max-creditor algorithm guarantees ≤ N-1
  // transactions for N non-zero participants.

  it("produces ≤ N-1 edges for N=3 chain", () => {
    // Alice paid 30, owes 0   → +30
    // Bob paid 0, owes 20     → -20
    // Carol paid 0, owes 10   → -10
    const balances: MemberBalance[] = [
      { memberId: "alice", memberName: "Alice", paid: 30, owed: 0, balance: 30 },
      { memberId: "bob", memberName: "Bob", paid: 0, owed: 20, balance: -20 },
      { memberId: "carol", memberName: "Carol", paid: 0, owed: 10, balance: -10 },
    ];
    const debts = minimizeDebts(balances);
    const nonZero = balances.filter((b) => b.balance !== 0).length;
    expect(debts.length).toBeLessThanOrEqual(nonZero - 1);
    expect(debts.length).toBe(2);
    // Verify total transfer matches
    const totalTransfer = debts.reduce((s, d) => s + d.amount, 0);
    expect(totalTransfer).toBe(30);
  });

  it("produces 0 edges for all-zero balances", () => {
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "A", paid: 0, owed: 0, balance: 0 },
      { memberId: "b", memberName: "B", paid: 0, owed: 0, balance: 0 },
    ];
    const debts = minimizeDebts(balances);
    expect(debts).toEqual([]);
  });

  it("produces ≤ N-1 edges for N=5 random-like scenario", () => {
    // Random-ish balances: +40, -25, -10, +15, -20
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "A", paid: 40, owed: 0, balance: 40 },
      { memberId: "b", memberName: "B", paid: 0, owed: 25, balance: -25 },
      { memberId: "c", memberName: "C", paid: 0, owed: 10, balance: -10 },
      { memberId: "d", memberName: "D", paid: 15, owed: 0, balance: 15 },
      { memberId: "e", memberName: "E", paid: 0, owed: 20, balance: -20 },
    ];
    const debts = minimizeDebts(balances);
    const nonZero = balances.filter((b) => b.balance !== 0).length;
    expect(debts.length).toBeLessThanOrEqual(nonZero - 1);
    // Verify net-zero: sum of all transfer amounts from debtors = sum to creditors
    const totalFrom = debts.reduce((s, d) => s + d.amount, 0);
    const totalPos = balances.reduce((s, b) => s + Math.max(b.balance, 0), 0);
    expect(Math.abs(totalFrom - totalPos)).toBeLessThan(0.01);
  });

  it("handles disconnected subgraphs with ≤ N-1 edges", () => {
    // Subgraph 1: Alice owes Bob 20
    // Subgraph 2: Carol owes Dave 15
    // No relation between subgraphs → 2 edges needed
    const balances: MemberBalance[] = [
      { memberId: "alice", memberName: "Alice", paid: 0, owed: 20, balance: -20 },
      { memberId: "bob", memberName: "Bob", paid: 20, owed: 0, balance: 20 },
      { memberId: "carol", memberName: "Carol", paid: 0, owed: 15, balance: -15 },
      { memberId: "dave", memberName: "Dave", paid: 15, owed: 0, balance: 15 },
    ];
    const debts = minimizeDebts(balances);
    const nonZero = balances.filter((b) => b.balance !== 0).length;
    expect(debts.length).toBeLessThanOrEqual(nonZero - 1);
    expect(debts.length).toBe(2);
  });

  it("handles N=10 with all non-zero balances", () => {
    // 10 participants, each with a unique balance that sums to zero
    const amounts = [100, 50, 25, 10, 5, -30, -40, -60, -20, -40];
    const balances: MemberBalance[] = amounts.map((a, i) => ({
      memberId: `m${i}`,
      memberName: `M${i}`,
      paid: a > 0 ? a : 0,
      owed: a < 0 ? -a : 0,
      balance: a,
    }));
    const debts = minimizeDebts(balances);
    const nonZero = balances.filter((b) => b.balance !== 0).length;
    expect(debts.length).toBeLessThanOrEqual(nonZero - 1);
    // Verify settlement is exact (all debts cleared)
    const totalTransfer = debts.reduce((s, d) => s + d.amount, 0);
    const totalPositive = amounts.filter((a) => a > 0).reduce((s, a) => s + a, 0);
    expect(Math.abs(totalTransfer - totalPositive)).toBeLessThan(0.01);
  });
});
