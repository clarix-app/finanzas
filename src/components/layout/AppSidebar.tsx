// ============================================================
// App Sidebar — with real user info + logout
// ============================================================

import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import type { AppPage } from "@/types";
import {
  LayoutDashboard, ShoppingCart, Package, TrendingUp,
  CreditCard, Globe, BarChart3, FileUp, Settings,
  Zap, LogOut,
} from "lucide-react";

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dividerBefore?: boolean;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "global", label: "Global", icon: Globe },
  { id: "importar", label: "Importar Excel", icon: FileUp },
  { id: "configuracion", label: "Configuración", icon: Settings, dividerBefore: true },
];

export default function AppSidebar() {
  const { state, dispatch } = useApp();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const displayEmail = user?.email || "—";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <aside className="w-[240px] flex-shrink-0 h-screen flex flex-col border-r border-border bg-sidebar overflow-hidden">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm leading-none">Rentabilidad</p>
            <p className="text-muted-foreground text-[11px] leading-none mt-0.5">MVP</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          const isActive = state.currentPage === item.id;
          const Icon = item.icon;

          return (
            <div key={item.id}>
              {item.dividerBefore && (
                <div className="my-2 mx-2 border-t border-sidebar-border" />
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => dispatch({ type: "SET_PAGE", page: item.id })}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150 cursor-pointer text-left
                  ${isActive
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-0.5 h-5 bg-primary rounded-r"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </motion.button>
            </div>
          );
        })}
      </nav>

      {/* Footer — user info + logout */}
      <div className="p-3 border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-semibold">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-xs font-medium truncate">{displayName}</p>
            <p className="text-muted-foreground text-[11px] truncate">{displayEmail}</p>
          </div>
          <button
            onClick={signOut}
            title="Cerrar sesión"
            className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
