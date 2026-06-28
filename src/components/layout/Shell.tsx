import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { showToast } from "../ui/Toast";
import { friendlyError } from "../../utils/errors";
import { Divide, LogOut, Lock } from "lucide-react";
import styles from "./Shell.module.css";

const APP_VERSION = __APP_VERSION__;

export function Shell() {
  const { logout, changePassword } = useAuth();
  const { pathname } = useLocation();

  const isGroupDetail = pathname.includes("/group/");
  const isAddExpense = pathname.includes("/expense/new");
  const isDashboard = pathname === "/dashboard";

  // Change password
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    if (newPwd !== confirmPwd) {
      setPwdError("Las contraseñas no coinciden");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    setChangingPwd(true);
    try {
      await changePassword(currentPwd, newPwd);
      showToast("Contraseña actualizada", "success");
      setShowChangePwd(false);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setPwdError(friendlyError(err));
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          {isGroupDetail || isAddExpense ? (
            <Link to="/dashboard" className={styles.back}>
              ← Grupos
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className={styles.brand}
              onClick={(e) => {
                if (isDashboard) {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
            >
              <Divide size={22} color="#07819C" />
              <span>Divide</span>
            </Link>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <Button variant="ghost" size="sm" onClick={() => setShowChangePwd(true)} aria-label="Cambiar contraseña">
            <Lock size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut size={16} />
            Salir
          </Button>
        </div>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <span>Divide v{APP_VERSION} · Oscar Suarez</span>
      </footer>

      <Modal open={showChangePwd} onClose={() => setShowChangePwd(false)} title="Cambiar contraseña">
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Contraseña actual"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            placeholder="••••••"
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="••••••"
            required
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="••••••"
            required
          />
          {pwdError && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }} role="alert">{pwdError}</p>}
          <Button type="submit" size="lg" isLoading={changingPwd} style={{ width: "100%" }}>
            Actualizar contraseña
          </Button>
        </form>
      </Modal>
    </div>
  );
}
