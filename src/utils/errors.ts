export function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) return "Email o contraseña incorrectos";
    if (msg.includes("auth/email-already-in-use")) return "Este email ya está registrado";
    if (msg.includes("auth/weak-password")) return "La contraseña debe tener al menos 6 caracteres";
    if (msg.includes("auth/invalid-email")) return "El formato del email no es válido";
    if (msg.includes("permission-denied") || msg.includes("Missing or insufficient permissions")) return "No tienes permiso. Revisa tu conexión o vuelve a iniciar sesión";
    if (msg.includes("network") || msg.includes("unavailable")) return "Error de conexión. Revisa tu internet";
    return msg;
  }
  return "Algo salió mal. Inténtalo de nuevo";
}
