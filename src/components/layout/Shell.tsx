import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { Divide, LogOut } from "lucide-react";
import styles from "./Shell.module.css";

export function Shell() {
  const { logout } = useAuth();
  const { pathname } = useLocation();

  const isGroupDetail = pathname.includes("/group/");
  const isAddExpense = pathname.includes("/expense/new");

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          {isGroupDetail || isAddExpense ? (
            <Link to="/dashboard" className={styles.back}>
              ← Grupos
            </Link>
          ) : (
            <Link to="/dashboard" className={styles.brand}>
              <Divide size={22} color="#07819C" />
              <span>Divide</span>
            </Link>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut size={16} />
          Salir
        </Button>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
