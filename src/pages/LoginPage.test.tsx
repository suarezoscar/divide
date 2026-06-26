import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";

// Mock the auth hook
vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useAuth } from "../hooks/useAuth";

describe("LoginPage", () => {
  it("shows loading state", () => {
    (useAuth as any).mockReturnValue({ user: null, loading: true });
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    // Should render skeleton card, not plain text
    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument();
  });

  it("shows login form when not authenticated", () => {
    (useAuth as any).mockReturnValue({ user: null, loading: false, login: vi.fn(), register: vi.fn() });
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
  });

  it("toggles between login and register", async () => {
    (useAuth as any).mockReturnValue({ user: null, loading: false, login: vi.fn(), register: vi.fn() });
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: /Iniciar sesión/i })).toBeInTheDocument();
    await userEvent.click(screen.getByText("Regístrate"));
    expect(screen.getByRole("button", { name: /Crear cuenta/i })).toBeInTheDocument();
  });

  it("calls login on submit in login mode", async () => {
    const login = vi.fn();
    (useAuth as any).mockReturnValue({ user: null, loading: false, login, register: vi.fn() });
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText("Email"), "test@test.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /Iniciar sesión/i }));
    expect(login).toHaveBeenCalledWith("test@test.com", "123456");
  });

  it("shows error on failed login", async () => {
    const login = vi.fn().mockRejectedValue(new Error("auth/invalid-credential"));
    (useAuth as any).mockReturnValue({ user: null, loading: false, login, register: vi.fn() });
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByLabelText("Email"), "test@test.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /Iniciar sesión/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email o contraseña incorrectos");
  });
});
