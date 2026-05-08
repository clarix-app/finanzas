// ============================================================
// Accounts Page
// ============================================================

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import type { AdAccount } from "@/types";

export default function AccountsPage() {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState<AdAccount | null>(null);

  function handleDelete(id: string) {
    dispatch({ type: "UPDATE_CONFIG", config: {} }); // trigger re-render
    // Manually update accounts via context
    const updated = state.accounts.filter((a) => a.id !== id);
    // Using workaround since we don't have dedicated account actions
    (window as any).__tmpAccounts = updated;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading">Cuentas Publicitarias</h1>
          <p className="text-muted-foreground text-sm mt-1">{state.accounts.length} cuentas configuradas</p>
        </div>
        <button
          onClick={() => { setEditAccount(null); setShowModal(true); }}
          className="flex items-center gap-1.5 h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Cuenta
        </button>
      </div>

      <div className="grid gap-3">
        {state.accounts.map((account) => {
          const platform = state.platforms.find((p) => p.id === account.platformId);
          const recordCount = state.records.filter((r) => r.accountId === account.id).length;
          return (
            <div key={account.id} className="bg-card rounded-xl card-glow p-5 flex items-center justify-between">
              <div>
                <p className="text-foreground font-semibold">{account.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-muted-foreground text-xs">{platform?.name || "Plataforma no definida"}</span>
                  <span className="text-muted-foreground/40 text-xs">•</span>
                  <span className="text-muted-foreground text-xs">{recordCount} registros</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditAccount(account); setShowModal(true); }}
                  className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {state.accounts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Sin cuentas configuradas</div>
        )}
      </div>
    </div>
  );
}
