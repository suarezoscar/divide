import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { showToast } from "../components/ui/Toast";
import { friendlyError } from "../utils/errors";
import { Divide } from "lucide-react";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { user, loading, login, register, resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(searchParams.get("mode") === "register");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Sincronizar estado de React cuando gestores de contraseñas (Bitwarden, etc.)
  // autocompletan los campos (no disparan onChange de React directamente)
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const syncState = () => {
      const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
      const passInput = form.querySelector<HTMLInputElement>('input[name="password"]');
      if (emailInput && emailInput.value !== email) setEmail(emailInput.value);
      if (passInput && passInput.value !== password) setPassword(passInput.value);
    };

    form.addEventListener("input", syncState);
    // Algunos gestores tardan en llenar los campos, comprobamos al montar
    const timeout = setTimeout(syncState, 700);

    return () => {
      form.removeEventListener("input", syncState);
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setSendingReset(true);
    try {
      await resetPassword(forgotEmail.trim());
      showToast("Revisa tu email para restablecer la contraseña", "success");
      setShowForgot(false);
      setForgotEmail("");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSendingReset(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.skeletonCard}>
          <Skeleton width="100px" height="32px" />
          <Skeleton width="100%" height="44px" />
          <Skeleton width="100%" height="44px" />
          <Skeleton width="100%" height="44px" />
        </div>
      </div>
    );
  }

  if (user) {
    const pending = sessionStorage.getItem("pendingGroupId");
    if (pending) {
      sessionStorage.removeItem("pendingGroupId");
      return <Navigate to={`/join/${pending}`} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Leer valores del DOM real (gestores de contraseñas pueden no disparar onChange)
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const emailVal = (formData.get("email") as string) || email;
    const passVal = (formData.get("password") as string) || password;

    try {
      if (isRegister) {
        await register(emailVal, passVal);
      } else {
        await login(emailVal, passVal);
      }
    } catch (err: unknown) {
      setError(friendlyError(err));
    }
  };

  return (
    <div className={styles.shell}>
      <Card className={styles.card}>
        <div className={styles.brand}>
          <Divide size={32} color="#07819C" />
          <h1>Divide</h1>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
          />
          {error && <p className={styles.error} role="alert">{error}</p>}
          <Button type="submit" size="lg" style={{ width: "100%" }}>
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </Button>
          {!isRegister && (
            <button type="button" className={styles.forgotBtn} onClick={() => { setShowForgot(true); setForgotEmail(email); }}>
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </form>

        <p className={styles.switch}>
          {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button
            type="button"
            className={styles.switchBtn}
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>

        <Modal open={showForgot} onClose={() => setShowForgot(false)} title="Recuperar contraseña">
          <form onSubmit={handleForgotPassword} className={styles.resetForm}>
            <p className={styles.resetHint}>Te enviaremos un enlace para restablecer tu contraseña.</p>
            <Input
              label="Email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
            <Button type="submit" size="lg" isLoading={sendingReset} style={{ width: "100%" }}>
              Enviar enlace
            </Button>
          </form>
        </Modal>
      </Card>
    </div>
  );
}
