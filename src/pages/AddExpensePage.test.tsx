import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AddExpensePage } from "./AddExpensePage";

// Mock hooks
vi.mock("../hooks/useGroups", () => ({
  useGroup: () => ({
    group: {
      id: "g1",
      name: "Test Group",
      members: [
        { id: "alice", name: "Alice" },
        { id: "bob", name: "Bob" },
        { id: "carol", name: "Carol" },
      ],
    },
    loading: false,
  }),
  useGroups: () => ({ groups: [], loading: false, error: null, create: vi.fn() }),
}));

vi.mock("../hooks/useExpenses", () => ({
  useExpenses: () => ({
    expenses: [],
    loading: false,
    add: vi.fn().mockResolvedValue({ id: "e1" }),
    update: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock("../services/expenses", () => ({
  getExpense: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  docToExpense: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ groupId: "g1" }),
  };
});

describe("AddExpensePage", () => {
  it("renders the form with description and amount inputs", () => {
    render(
      <MemoryRouter>
        <AddExpensePage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText("Descripción")).toBeInTheDocument();
    expect(screen.getByLabelText("Importe total")).toBeInTheDocument();
  });

  it("shows members in split section", () => {
    render(
      <MemoryRouter>
        <AddExpensePage />
      </MemoryRouter>
    );
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carol").length).toBeGreaterThan(0);
  });

  it("allows excluding a member from the split", async () => {
    render(
      <MemoryRouter>
        <AddExpensePage />
      </MemoryRouter>
    );
    // All 3 checkboxes checked by default
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    expect(checkboxes[0]).toHaveAttribute("aria-checked", "true");
    // Click second checkbox to exclude Bob
    await userEvent.click(checkboxes[1]);
    expect(checkboxes[1]).toHaveAttribute("aria-checked", "false");
  });

  it("shows date inputs", () => {
    render(
      <MemoryRouter>
        <AddExpensePage />
      </MemoryRouter>
    );
    expect(screen.getByText("Fecha (opcional)")).toBeInTheDocument();
  });

  it("shows category chips", () => {
    render(
      <MemoryRouter>
        <AddExpensePage />
      </MemoryRouter>
    );
    expect(screen.getByText("🍕 Comida")).toBeInTheDocument();
    expect(screen.getByText("🚌 Transporte")).toBeInTheDocument();
  });

  it("shows payer section", () => {
    render(
      <MemoryRouter>
        <AddExpensePage />
      </MemoryRouter>
    );
    expect(screen.getByText("¿Quién pagó?")).toBeInTheDocument();
  });
});
