// ============================================================
// Auth Gate — shows Login/Register if not authenticated
// ============================================================

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const [view, setView] = useState<"login" | "register">("login");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner message="Verificando sesión..." />
      </div>
    );
  }

  if (!user) {
    if (view === "register") {
      return <RegisterPage onNavigateLogin={() => setView("login")} />;
    }
    return <LoginPage onNavigateRegister={() => setView("register")} />;
  }

  return <>{children}</>;
}
