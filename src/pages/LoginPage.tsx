import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Divide } from "lucide-react";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <div className={styles.shell}>
        <p>Cargando…</p>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Algo salió mal");
      }
    }
  };

  return (
    <div className={styles.shell}>
      <Card className={styles.card}>
        <div className={styles.brand}>
          <Divide size={32} color="#07819C" />
          <h1>Divide</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" size="lg" style={{ width: "100%" }}>
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </Button>
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
      </Card>
    </div>
  );
}
