import { describe, it, expect } from "vitest";
import { friendlyError } from "./errors";

describe("friendlyError", () => {
  it("maps auth/invalid-credential to Spanish", () => {
    const err = new Error("Firebase: Error (auth/invalid-credential)");
    expect(friendlyError(err)).toBe("Email o contraseña incorrectos");
  });

  it("maps auth/wrong-password to Spanish", () => {
    const err = new Error("Firebase: Error (auth/wrong-password)");
    expect(friendlyError(err)).toBe("Email o contraseña incorrectos");
  });

  it("maps auth/email-already-in-use to Spanish", () => {
    const err = new Error("Firebase: Error (auth/email-already-in-use)");
    expect(friendlyError(err)).toBe("Este email ya está registrado");
  });

  it("maps auth/weak-password to Spanish", () => {
    const err = new Error("Firebase: Error (auth/weak-password)");
    expect(friendlyError(err)).toBe("La contraseña debe tener al menos 6 caracteres");
  });

  it("maps permission-denied to Spanish", () => {
    const err = new Error("Missing or insufficient permissions");
    expect(friendlyError(err)).toContain("No tienes permiso");
  });

  it("maps network errors to Spanish", () => {
    const err = new Error("A network error (such as timeout) occurred");
    expect(friendlyError(err)).toContain("Error de conexión");
  });

  it("returns raw message for unknown errors", () => {
    const err = new Error("something_weird");
    expect(friendlyError(err)).toBe("something_weird");
  });

  it("handles non-Error objects gracefully", () => {
    expect(friendlyError("plain string")).toBe("Algo salió mal. Inténtalo de nuevo");
  });
});
