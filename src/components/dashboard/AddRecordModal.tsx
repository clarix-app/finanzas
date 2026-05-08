// ============================================================
// Add / Edit Record Modal (Sheet) — USD only
// ============================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { formatUSD, formatRoas } from "@/lib/calculations";
import { useProducts } from "@/hooks/useProducts";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave?: (record: any) => Promise<{ data: any; error: any }>;
  defaultDate?: string;
}

export default function AddRecordModal({ open, onClose, onSave, defaultDate }: Props) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { products, loading: loadingProducts } = useProducts();

  const [country, setCountry] = useState(() => localStorage.getItem('selectedCountry') ?? 'CL');
  const [form, setForm] = useState({
    date: defaultDate || new Date().toISOString().split("T")[0],
    productId: "",
    investment: "",
    revenue: "",
    variableCosts: "",
    notes: "",
  });

  useEffect(() => {
    if (products.length > 0 && !form.productId) {
      setForm((f) => ({ ...f, productId: products[0].id }));
    }
  }, [products]);

  const invNum  = parseFloat(form.investment)    || 0;
  const revNum  = parseFloat(form.revenue)        || 0;
  const costNum = parseFloat(form.variableCosts)  || 0;
  const previewRoas   = invNum > 0 ? revNum / invNum : 0;
  const previewProfit = revNum - invNum - costNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

    if (onSave) {
      localStorage.setItem('selectedCountry', country);
      const payload = {
        date: form.date,
        product_id: form.productId || null,
        currency_code: "USD",
        country,
        ad_spend_original:      invNum,
        revenue_original:       revNum,
        variable_cost_original: costNum,
        ad_spend_usd:           invNum,
        revenue_usd:            revNum,
        variable_cost_usd:      costNum,
        notes: form.notes || null,
      };
      const { error } = await onSave(payload);
      setSaving(false);
      if (error) {
        setSaveError(error.message || "Error al guardar. Verifica la conexión.");
        return;
      }
    }

    setSaving(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed right-0 top-0 h-full w-[440px] bg-card border-l border-border z-50 flex flex-col shadow-elevated overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="section-heading">Nuevo Registro</h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Todos los valores en <span className="text-primary font-semibold">USD</span>
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form id="add-record-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">

              <Field label="Fecha">
                <input
                  type="date" required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="form-input"
                />
              </Field>

              <Field label="Producto">
                <select
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="form-input"
                  disabled={loadingProducts}
                >
                  {loadingProducts && <option value="">Cargando productos...</option>}
                  {!loadingProducts && products.length === 0 && (
                    <option value="">Sin productos — crea uno primero</option>
                  )}
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="País">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="form-input"
                >
                  <option value="CL">Chile</option>
                  <option value="VE">Venezuela</option>
                  <option value="MX">México</option>
                  <option value="AR">Argentina</option>
                  <option value="EC">Ecuador</option>
                  <option value="PY">Paraguay</option>
                </select>
              </Field>

              <Field label="Inversión Ads (USD)">
                <input
                  type="number" required min={0} step="0.01" placeholder="ej. 150.00"
                  value={form.investment}
                  onChange={(e) => setForm({ ...form, investment: e.target.value })}
                  className="form-input"
                />
              </Field>

              <Field label="Facturación (USD)">
                <input
                  type="number" required min={0} step="0.01" placeholder="ej. 580.00"
                  value={form.revenue}
                  onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                  className="form-input"
                />
              </Field>

              <Field label="Costos Variables (USD) — opcional">
                <input
                  type="number" min={0} step="0.01" placeholder="ej. 50.00"
                  value={form.variableCosts}
                  onChange={(e) => setForm({ ...form, variableCosts: e.target.value })}
                  className="form-input"
                />
              </Field>

              <Field label="Notas — opcional">
                <textarea
                  rows={3} placeholder="Observaciones del día..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="form-input resize-none"
                />
              </Field>

              {/* Preview */}
              {(form.investment || form.revenue) && (
                <div className="bg-muted rounded-lg p-4 text-xs space-y-1">
                  <p className="label-caps mb-2">Vista previa</p>
                  <Row label="Inversión"  value={formatUSD(invNum)} />
                  <Row label="Facturación" value={formatUSD(revNum)} />
                  <Row label="ROAS"        value={formatRoas(previewRoas)} />
                  <Row label="Utilidad"    value={formatUSD(previewProfit)} />
                </div>
              )}
            </form>

            {/* Error */}
            {saveError && (
              <div className="px-6 pt-3">
                <p className="text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {saveError}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
              <button
                type="button" onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors text-foreground"
              >
                Cancelar
              </button>
              <button
                form="add-record-form"
                type="submit"
                disabled={saving || loadingProducts}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Agregar registro"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="label-caps">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-semibold tabular">{value}</span>
    </div>
  );
}
