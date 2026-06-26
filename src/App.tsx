import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Shell } from "./components/layout/Shell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { AddExpensePage } from "./pages/AddExpensePage";
import { JoinGroupPage } from "./pages/JoinGroupPage";
import { ToastContainer } from "./components/ui/Toast";
import { Divide } from "lucide-react";
import styles from "./App.module.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className={styles.splash}>
      <Divide size={48} color="#07819C" />
      <span className={styles.splashText}>Divide</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AddExpensePageWithKey() {
  const { groupId, expenseId } = useParams();
  return <AddExpensePage key={`${groupId}-${expenseId ?? "new"}`} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join/:groupId" element={<JoinGroupPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/group/:groupId" element={<GroupDetailPage />} />
        <Route path="/group/:groupId/expense/new" element={<AddExpensePageWithKey />} />
        <Route path="/group/:groupId/expense/:expenseId" element={<AddExpensePageWithKey />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}
