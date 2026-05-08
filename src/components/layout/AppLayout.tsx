// ============================================================
// App Layout – Shell with sidebar + header
// ============================================================

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { useApp } from "@/context/AppContext";

// Page imports
import DashboardPage from "@/pages/DashboardPage";
import SalesPage from "@/pages/SalesPage";
import ProductsPage from "@/pages/ProductsPage";
import AdSpendPage from "@/pages/AdSpendPage";
import AccountsPage from "@/pages/AccountsPage";
import PlatformsPage from "@/pages/PlatformsPage";
import AnalysisPage from "@/pages/AnalysisPage";
import ImportPage from "@/pages/ImportPage";
import ConfigPage from "@/pages/ConfigPage";
import GlobalPage from "@/pages/GlobalPage";

const pageMap: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  global: GlobalPage,
  ventas: SalesPage,
  productos: ProductsPage,
  "gastos-ads": AdSpendPage,
  cuentas: AccountsPage,
  plataformas: PlatformsPage,
  analisis: AnalysisPage,
  importar: ImportPage,
  configuracion: ConfigPage,
};

export default function AppLayout() {
  const { state } = useApp();
  const PageComponent = pageMap[state.currentPage] ?? DashboardPage;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentPage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <PageComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
