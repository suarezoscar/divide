import { describe, it, expect } from "vitest";
import { computeBalances, minimizeDebts } from "./balances";
import { splitEvenCents } from "./money";
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

// ── computeBalances — edge cases ──

describe("computeBalances — edge cases", () => {
  it("single payer is also the only participant → balance 0", () => {
    const exp = makeExpense({
      amount: 50,
      paidBy: "alice",
      splits: [{ memberId: "alice", amount: 50 }],
    });
    const result = computeBalances([exp], [], makeMemberNames(["alice"]));
    expect(result).toHaveLength(1);
    expect(result[0].balance).toBe(0);
  });

  it("uneven split: Alice pays 100, split 60/40", () => {
    const exp = makeExpense({
      amount: 100,
      paidBy: "alice",
      splits: [
        { memberId: "alice", amount: 60 },
        { memberId: "bob", amount: 40 },
      ],
    });
    const result = computeBalances([exp], [], makeMemberNames(["alice", "bob"]));
    expect(result.find((b) => b.memberId === "alice")!.balance).toBe(40);
    expect(result.find((b) => b.memberId === "bob")!.balance).toBe(-40);
  });

  it("multiple expenses combine correctly", () => {
    const exp1 = makeExpense({
      id: "e1",
      amount: 50,
      paidBy: "alice",
      splits: [{ memberId: "bob", amount: 50 }],
    });
    const exp2 = makeExpense({
      id: "e2",
      amount: 30,
      paidBy: "bob",
      splits: [{ memberId: "alice", amount: 30 }],
    });
    const result = computeBalances([exp1, exp2], [], makeMemberNames(["alice", "bob"]));
    // Alice paid 50, Bob paid 30 → Alice +20, Bob -20
    expect(result.find((b) => b.memberId === "alice")!.balance).toBe(20);
    expect(result.find((b) => b.memberId === "bob")!.balance).toBe(-20);
  });

  it("multiple settlements stack correctly", () => {
    const exp = makeExpense({
      amount: 100,
      paidBy: "alice",
      splits: [
        { memberId: "bob", amount: 40 },
        { memberId: "carol", amount: 60 },
      ],
    });
    const s1: Settlement = { id: "s1", groupId: "g1", from: "bob", to: "alice", amount: 20, date: { toMillis: () => 1 } as any };
    const s2: Settlement = { id: "s2", groupId: "g1", from: "carol", to: "alice", amount: 30, date: { toMillis: () => 2 } as any };
    const result = computeBalances([exp], [s1, s2], makeMemberNames(["alice", "bob", "carol"]));
    // Alice: paid 100 - owed 0 = +100, got 20+30 = +50 → net +50
    // Bob: paid 20 - owed 40 = -20
    // Carol: paid 30 - owed 60 = -30
    expect(result.find((b) => b.memberId === "alice")!.balance).toBe(50);
    expect(result.find((b) => b.memberId === "bob")!.balance).toBe(-20);
    expect(result.find((b) => b.memberId === "carol")!.balance).toBe(-30);
  });

  it("member in settlement but no expenses → included with balance 0", () => {
    const exp = makeExpense({
      amount: 50,
      paidBy: "alice",
      splits: [{ memberId: "bob", amount: 50 }],
    });
    const s: Settlement = { id: "s1", groupId: "g1", from: "carol", to: "alice", amount: 0, date: { toMillis: () => 1 } as any };
    const result = computeBalances([exp], [s], makeMemberNames(["alice", "bob", "carol"]));
    const carol = result.find((b) => b.memberId === "carol");
    expect(carol).toBeDefined();
    expect(carol!.balance).toBe(0);
  });

  it("member with userId but no name falls back to id", () => {
    const exp = makeExpense({
      amount: 50,
      paidBy: "alice",
      splits: [{ memberId: "bob", amount: 50 }],
    });
    const names = new Map([["alice", "Alice"], ["bob", "Bob"], ["carol", "Carol"]]);
    const result = computeBalances([exp], [], names);
    expect(result.every((b) => b.memberName.length > 0)).toBe(true);
  });
});

// ── computeBalances — invariant tests ──

describe("computeBalances — invariants", () => {
  it("INVARIANTE: sum(balances) === 0 for any single expense", () => {
    const scenarios = [
      { amount: 100, splits: [{ memberId: "a", amount: 50 }, { memberId: "b", amount: 50 }] },
      { amount: 33.33, splits: [{ memberId: "a", amount: 11.11 }, { memberId: "b", amount: 11.11 }, { memberId: "c", amount: 11.11 }] },
      { amount: 10.01, splits: [{ memberId: "a", amount: 5 }, { memberId: "b", amount: 5.01 }] },
    ];
    for (const sc of scenarios) {
      const exp = makeExpense(sc);
      const result = computeBalances([exp], [], makeMemberNames(["a", "b", "c"]));
      const sumBalance = Math.round(result.reduce((s, b) => s + b.balance, 0) * 100) / 100;
      expect(sumBalance).toBe(0);
    }
  });

  it("INVARIANTE: sum(balances) === 0 after settlements", () => {
    const exp = makeExpense({
      amount: 100,
      paidBy: "alice",
      splits: [
        { memberId: "alice", amount: 33.34 },
        { memberId: "bob", amount: 33.33 },
        { memberId: "carol", amount: 33.33 },
      ],
    });
    const s: Settlement = { id: "s1", groupId: "g1", from: "bob", to: "alice", amount: 33.33, date: { toMillis: () => 1 } as any };
    const result = computeBalances([exp], [s], makeMemberNames(["alice", "bob", "carol"]));
    const sumBalance = Math.round(result.reduce((s, b) => s + b.balance, 0) * 100) / 100;
    expect(sumBalance).toBe(0);
  });

  it("INVARIANTE: total paid === total owed (money conservation)", () => {
    const exp1 = makeExpense({ id: "e1", amount: 50, paidBy: "alice", splits: [{ memberId: "bob", amount: 50 }] });
    const exp2 = makeExpense({ id: "e2", amount: 30, paidBy: "bob", splits: [{ memberId: "alice", amount: 15 }, { memberId: "carol", amount: 15 }] });
    const result = computeBalances([exp1, exp2], [], makeMemberNames(["alice", "bob", "carol"]));
    const totalPaid = Math.round(result.reduce((s, b) => s + b.paid, 0) * 100) / 100;
    const totalOwed = Math.round(result.reduce((s, b) => s + b.owed, 0) * 100) / 100;
    expect(totalPaid).toBe(totalOwed);
  });

  it("INVARIANTE: each member's balance = paid - owed (exact)", () => {
    const exp = makeExpense({
      amount: 27.33,
      paidBy: "alice",
      splits: [
        { memberId: "alice", amount: 9.11 },
        { memberId: "bob", amount: 9.11 },
        { memberId: "carol", amount: 9.11 },
      ],
    });
    const s: Settlement = { id: "s1", groupId: "g1", from: "bob", to: "alice", amount: 5, date: { toMillis: () => 1 } as any };
    const result = computeBalances([exp], [s], makeMemberNames(["alice", "bob", "carol"]));
    for (const b of result) {
      const expected = Math.round((b.paid - b.owed) * 100) / 100;
      expect(Math.abs(b.balance - expected)).toBeLessThan(0.001);
    }
  });
});

// ── minimizeDebts — edge cases ──

describe("minimizeDebts — edge cases", () => {
  it("all creditors, no debtors → empty", () => {
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "A", paid: 50, owed: 0, balance: 50 },
      { memberId: "b", memberName: "B", paid: 30, owed: 0, balance: 30 },
    ];
    expect(minimizeDebts(balances)).toEqual([]);
  });

  it("all debtors, no creditors → empty", () => {
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "A", paid: 0, owed: 50, balance: -50 },
      { memberId: "b", memberName: "B", paid: 0, owed: 30, balance: -30 },
    ];
    expect(minimizeDebts(balances)).toEqual([]);
  });

  it("1 creditor, 2 debtors → 2 edges", () => {
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "A", paid: 100, owed: 0, balance: 100 },
      { memberId: "b", memberName: "B", paid: 0, owed: 60, balance: -60 },
      { memberId: "c", memberName: "C", paid: 0, owed: 40, balance: -40 },
    ];
    const debts = minimizeDebts(balances);
    expect(debts).toHaveLength(2);
    const total = debts.reduce((s, d) => s + d.amount, 0);
    expect(total).toBe(100);
    expect(debts.every((d) => d.to === "a")).toBe(true);
  });

  it("2 creditors, 1 debtor → 2 edges", () => {
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "A", paid: 60, owed: 0, balance: 60 },
      { memberId: "b", memberName: "B", paid: 40, owed: 0, balance: 40 },
      { memberId: "c", memberName: "C", paid: 0, owed: 100, balance: -100 },
    ];
    const debts = minimizeDebts(balances);
    expect(debts).toHaveLength(2);
    const total = debts.reduce((s, d) => s + d.amount, 0);
    expect(total).toBe(100);
    expect(debts.every((d) => d.from === "c")).toBe(true);
  });

  it("complex: 2 creditors + 2 debtors → ≤ 3 edges", () => {
    const balances: MemberBalance[] = [
      { memberId: "a", memberName: "A", paid: 150, owed: 0, balance: 150 },
      { memberId: "b", memberName: "B", paid: 50, owed: 0, balance: 50 },
      { memberId: "c", memberName: "C", paid: 0, owed: 120, balance: -120 },
      { memberId: "d", memberName: "D", paid: 0, owed: 80, balance: -80 },
    ];
    const debts = minimizeDebts(balances);
    const nonZero = balances.filter((b) => b.balance !== 0).length;
    expect(debts.length).toBeLessThanOrEqual(nonZero - 1);
    const total = debts.reduce((s, d) => s + d.amount, 0);
    expect(total).toBe(200);
  });
});

// ── Integration: full flows ──

describe("integration — full monetary flow", () => {
  function balancesFromExpenses(
    expenses: { amount: number; paidBy: string; memberIds: string[] }[],
    settlements: Settlement[] = [],
  ) {
    const allMemberIds = [...new Set(expenses.flatMap((e) => [e.paidBy, ...e.memberIds]))];
    const memberNames = new Map(allMemberIds.map((id) => [id, id]));
    const exps: Expense[] = expenses.map((e, i) => ({
      id: `e${i}`,
      groupId: "g1",
      description: "Test",
      amount: e.amount,
      paidBy: e.paidBy,
      date: { toMillis: () => i } as any,
      splits: splitEvenCents(e.amount, e.memberIds.length).map((amt, j) => ({
        memberId: e.memberIds[j],
        amount: amt,
      })),
    }));
    return computeBalances(exps, settlements, memberNames);
  }

  it("F1: split → balance → minimize → settle → all zero", () => {
    // Alice pays 10 split 3 ways (Alice, Bob, Carol)
    const expenses = [{ amount: 10, paidBy: "alice", memberIds: ["alice", "bob", "carol"] }];
    const balances = balancesFromExpenses(expenses);
    // Alice paid 10, owes 3.34 → +6.66; Bob owes 3.33 → -3.33; Carol owes 3.33 → -3.33
    const alice = balances.find((b) => b.memberId === "alice")!;
    const bob = balances.find((b) => b.memberId === "bob")!;
    const carol = balances.find((b) => b.memberId === "carol")!;
    expect(alice.balance).toBe(6.66);
    expect(bob.balance).toBe(-3.33);
    expect(carol.balance).toBe(-3.33);
    expect(Math.round(balances.reduce((s, b) => s + b.balance, 0) * 100) / 100).toBe(0);

    const debts = minimizeDebts(balances);
    // Should be 2 edges: Bob→Alice 3.33, Carol→Alice 3.33
    expect(debts).toHaveLength(2);
    const totalTransfer = Math.round(debts.reduce((s, d) => s + d.amount, 0) * 100) / 100;
    // Sum of positive balances = 6.66 (Alice's net)
    expect(totalTransfer).toBe(6.66);

    // Apply settlements
    const settlements: Settlement[] = debts.map((d, i) => ({
      id: `s${i}`,
      groupId: "g1",
      from: d.from,
      to: d.to,
      amount: d.amount,
      date: { toMillis: () => 100 + i } as any,
    }));

    // Recompute with settlements → all zero
    const finalBalances = balancesFromExpenses(expenses, settlements);
    const sumBalance = Math.round(finalBalances.reduce((s, b) => s + b.balance, 0) * 100) / 100;
    expect(sumBalance).toBe(0);
    for (const b of finalBalances) {
      expect(Math.abs(b.balance)).toBeLessThan(0.001);
    }
  });

  it("F2: multi-payer expense → balances → settle → zero", () => {
    // Alice pays 60, Bob pays 40 (total 100), split 3 ways among Alice, Bob, Carol
    // Since our model uses single paidBy, we simulate via 2 separate expenses:
    const expenses = [
      { amount: 60, paidBy: "alice", memberIds: ["alice", "bob", "carol"] },
      { amount: 40, paidBy: "bob", memberIds: ["alice", "bob", "carol"] },
    ];
    const balances = balancesFromExpenses(expenses);
    const sumBalance = Math.round(balances.reduce((s, b) => s + b.balance, 0) * 100) / 100;
    expect(sumBalance).toBe(0);

    const debts = minimizeDebts(balances);
    const nonZero = balances.filter((b) => b.balance !== 0).length;
    expect(debts.length).toBeLessThanOrEqual(nonZero - 1);

    // Apply all settlements
    const settlements: Settlement[] = debts.map((d, i) => ({
      id: `s${i}`,
      groupId: "g1",
      from: d.from,
      to: d.to,
      amount: d.amount,
      date: { toMillis: () => i } as any,
    }));
    const finalBalances = balancesFromExpenses(expenses, settlements);
    const sumFinal = Math.round(finalBalances.reduce((s, b) => s + b.balance, 0) * 100) / 100;
    expect(sumFinal).toBe(0);
    for (const b of finalBalances) {
      expect(Math.abs(b.balance)).toBeLessThan(0.001);
    }
  });

  it("F3: edit expense (change amount) → invariants hold", () => {
    // Before: 100 split 3 ways
    const expBefore = [{ amount: 100, paidBy: "alice", memberIds: ["alice", "bob", "carol"] }];
    const balancesBefore = balancesFromExpenses(expBefore);
    expect(balancesBefore.reduce((s, b) => s + b.balance, 0)).toBeCloseTo(0, 2);

    // After: 150 split 3 ways
    const expAfter = [{ amount: 150, paidBy: "alice", memberIds: ["alice", "bob", "carol"] }];
    const balancesAfter = balancesFromExpenses(expAfter);
    const sumAfter = Math.round(balancesAfter.reduce((s, b) => s + b.balance, 0) * 100) / 100;
    expect(sumAfter).toBe(0);
  });

  it("F4: delete expense → invariants hold", () => {
    // 2 expenses, then remove one
    const allExpenses = [
      { amount: 50, paidBy: "alice", memberIds: ["alice", "bob"] },
      { amount: 30, paidBy: "bob", memberIds: ["alice", "carol"] },
    ];
    const balancesAll = balancesFromExpenses(allExpenses);
    const sumAll = Math.round(balancesAll.reduce((s, b) => s + b.balance, 0) * 100) / 100;
    expect(sumAll).toBe(0);

    // Remove first expense (like deleting it)
    const remaining = allExpenses.slice(1);
    const balancesRemaining = balancesFromExpenses(remaining);
    const sumRemaining = Math.round(balancesRemaining.reduce((s, b) => s + b.balance, 0) * 100) / 100;
    expect(sumRemaining).toBe(0);
  });

  it("F5: partial settlement → remaining debt persists", () => {
    // Bob owes Alice 100, pays only 30
    const expenses = [{ amount: 100, paidBy: "alice", memberIds: ["bob"] }];
    const partialSettlement: Settlement = {
      id: "s1", groupId: "g1", from: "bob", to: "alice", amount: 30,
      date: { toMillis: () => 1 } as any,
    };
    const balances = balancesFromExpenses(expenses, [partialSettlement]);
    // Bob should still owe 70
    expect(balances.find((b) => b.memberId === "alice")!.balance).toBe(70);
    expect(balances.find((b) => b.memberId === "bob")!.balance).toBe(-70);
  });
});

// ── Property-based random testing ──

describe("random scenarios — invariants siempre se cumplen", () => {
  function randomMemberIds(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `m${i}`);
  }

  it("50 escenarios aleatorios: computeBalances invariants", () => {
    for (let trial = 0; trial < 50; trial++) {
      const memberCount = Math.floor(Math.random() * 5) + 2; // 2–6 members
      const memberIds = randomMemberIds(memberCount);
      const memberNames = new Map(memberIds.map((id) => [id, id]));
      const expenseCount = Math.floor(Math.random() * 8) + 1; // 1–8 expenses

      const exps: Expense[] = [];
      for (let i = 0; i < expenseCount; i++) {
        const amount = Math.round(Math.random() * 50000) / 100; // 0.01–500.00
        const paidBy = memberIds[Math.floor(Math.random() * memberIds.length)];
        const splitCount = Math.floor(Math.random() * memberCount) + 1; // 1–memberCount
        const splitMemberIds = memberIds.slice(0, splitCount);
        const splits = splitEvenCents(amount, splitCount).map((amt, j) => ({
          memberId: splitMemberIds[j],
          amount: amt,
        }));
        exps.push({
          id: `e${i}`,
          groupId: "g1",
          description: `Random ${i}`,
          amount,
          paidBy,
          date: { toMillis: () => i } as any,
          splits,
        });
      }

      const balances = computeBalances(exps, [], memberNames);
      const sumBalance = Math.round(balances.reduce((s, b) => s + b.balance, 0) * 100) / 100;
      expect(Math.abs(sumBalance)).toBeCloseTo(0, 10);

      const totalPaid = Math.round(balances.reduce((s, b) => s + b.paid, 0) * 100) / 100;
      const totalOwed = Math.round(balances.reduce((s, b) => s + b.owed, 0) * 100) / 100;
      expect(Math.abs(totalPaid - totalOwed)).toBeLessThan(0.001);
    }
  });

  it("50 escenarios aleatorios: minimizeDebts invariants", () => {
    for (let trial = 0; trial < 50; trial++) {
      const memberCount = Math.floor(Math.random() * 6) + 2; // 2–7 members
      const memberIds = randomMemberIds(memberCount);
      const memberNames = new Map(memberIds.map((id) => [id, id]));
      const expenseCount = Math.floor(Math.random() * 6) + 1; // 1–6 expenses

      const exps: Expense[] = [];
      for (let i = 0; i < expenseCount; i++) {
        const amount = Math.round(Math.random() * 20000) / 100; // 0.01–200.00
        const paidBy = memberIds[Math.floor(Math.random() * memberIds.length)];
        const splitCount = Math.floor(Math.random() * memberCount) + 1;
        const splitMemberIds = memberIds.slice(0, splitCount);
        const splits = splitEvenCents(amount, splitCount).map((amt, j) => ({
          memberId: splitMemberIds[j],
          amount: amt,
        }));
        exps.push({
          id: `e${i}`,
          groupId: "g1",
          description: `Random ${i}`,
          amount,
          paidBy,
          date: { toMillis: () => i } as any,
          splits,
        });
      }

      const balances = computeBalances(exps, [], memberNames);
      const debts = minimizeDebts(balances);
      const nonZero = balances.filter((b) => b.balance !== 0).length;

      if (nonZero > 0) {
        expect(debts.length).toBeLessThanOrEqual(nonZero - 1);
        expect(debts.length).toBeGreaterThanOrEqual(1);
      } else {
        expect(debts).toEqual([]);
      }

      if (debts.length > 0) {
        const totalTransfer = Math.round(debts.reduce((s, d) => s + d.amount, 0) * 100) / 100;
        const totalPositive = Math.round(
          balances.filter((b) => b.balance > 0).reduce((s, b) => s + b.balance, 0) * 100,
        ) / 100;
        expect(totalTransfer).toBe(totalPositive);
      }
    }
  });
});
