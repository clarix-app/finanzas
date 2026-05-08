// ============================================================
// Products Page — Supabase-backed
// ============================================================

import { useState } from "react";
import { Plus, Pencil, Trash2, X, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { formatUSD, formatRoas, formatPercent, profitStatusClass, roasStatusClass, MONTHS_ES } from "@/lib/calculations";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { useDailyRecords } from "@/hooks/useDailyRecords";
import { toast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const { state } = useApp();
  const { products, loading: loadingProducts, addProduct, deleteProduct } = useProducts();
  const { records, loading: loadingRecords } = useDailyRecords(state.selectedYear, state.selectedMonth, state.selectedCountry);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  function handleNewProduct() {
    setEditProduct(null);
    setShowModal(true);
  }

  const loading = loadingProducts || loadingRecords;

  const productStats = products.map((p: any) => {
    const recs = records.filter((r: any) => (r.product_id ?? r.productId) === p.id);
    const investmentUsd = recs.reduce((s: number, r: any) => s + (r.ads_spend_usd ?? r.investmentUsd ?? 0), 0);
    const revenueUsd    = recs.reduce((s: number, r: any) => s + (r.revenue_usd ?? r.revenueUsd ?? 0), 0);
    const varCostsUsd   = recs.reduce((s: number, r: any) => s + (r.variable_costs_usd ?? 0), 0);
    const profit = revenueUsd - investmentUsd - varCostsUsd;
    const roas   = investmentUsd > 0 ? revenueUsd / investmentUsd : 0;
    const margin = revenueUsd > 0 ? profit / revenueUsd : 0;
    const days   = new Set(recs.map((r: any) => r.date)).size;
    return { ...p, investmentUsd, revenueUsd, varCostsUsd, profit, roas, margin, days };
  });

  const totalRevenue = productStats.reduce((s: number, p: any) => s + p.revenueUsd, 0);
  const activeStats  = productStats.filter((p: any) => p.days > 0);

  async function handleSave(data: any) {
    if (editProduct) {
      setShowModal(false);
      setEditProduct(null);
      return;
    }

    const { error } = await addProduct({
      name: data.name,
      price_usd: data.price_usd ? parseFloat(data.price_usd) : null,
      active: true,
    });

    if (error) {
      toast({ title: "Error al guardar", description: error.message ?? "No se pudo guardar el producto.", variant: "destructive" });
      return;
    }

    toast({ title: "Producto guardado", description: `"${data.name}" fue agregado correctamente.` });
    setShowModal(false);
    setEditProduct(null);
  }

  const monthLabel = `${MONTHS_ES[(state.selectedMonth ?? 1) - 1]} ${state.selectedYear}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.filter((p: any) => p.active ?? p.isActive).length} productos activos · Valores en USD
          </p>
        </div>
        <button
          onClick={handleNewProduct}
          className="flex items-center gap-1.5 h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Cargando productos..." />
      ) : (
        <>
          {/* Products table */}
          <div className="bg-card rounded-xl card-glow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Producto", "Inversión USD", "Facturación USD", "ROAS", "Utilidad USD", "Días", "Estado", ""].map((h) => (
                      <th key={h} className="label-caps text-left px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productStats.map((p: any) => (
                    <tr key={p.id} className={`table-row-hover border-b border-border/50 last:border-0 ${!(p.active ?? p.isActive) ? "opacity-40" : ""}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${(p.active ?? p.isActive) ? "bg-success" : "bg-muted-foreground"}`} />
                          <span className="font-semibold text-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 tabular text-muted-foreground">{formatUSD(p.investmentUsd)}</td>
                      <td className="px-5 py-4 tabular text-foreground">{formatUSD(p.revenueUsd)}</td>
                      <td className={`px-5 py-4 tabular font-semibold ${p.roas >= 1.5 ? "status-green" : p.roas >= 1.0 ? "status-yellow" : "status-red"}`}>
                        {p.days > 0 ? formatRoas(p.roas) : "—"}
                      </td>
                      <td className={`px-5 py-4 tabular font-semibold ${profitStatusClass(p.profit)}`}>
                        {p.days > 0 ? formatUSD(p.profit) : "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{p.days}</td>
                      <td className="px-5 py-4">
                        {p.days > 0 && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roasStatusClass(p.roas)}`}>
                            {p.roas >= 1.5 ? "Excelente" : p.roas >= 1.3 ? "Bueno" : p.roas >= 1.0 ? "Precaución" : "Alerta"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditProduct(p); setShowModal(true); }}
                            className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Sin productos en la base de datos. Crea el primero.
                </div>
              )}
            </div>
          </div>

          {/* ── Rentabilidad del mes ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="section-heading text-base">Rentabilidad del mes — {monthLabel}</h2>
            </div>

            {activeStats.length === 0 ? (
              <div className="bg-card rounded-xl card-glow px-6 py-10 text-center text-muted-foreground text-sm">
                Sin registros para {monthLabel}. Agrega ventas en la sección de Registros.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {activeStats
                  .sort((a: any, b: any) => b.revenueUsd - a.revenueUsd)
                  .map((p: any, i: number) => {
                    const sharePercent = totalRevenue > 0 ? (p.revenueUsd / totalRevenue) * 100 : 0;
                    const marginPct    = p.revenueUsd > 0 ? (p.profit / p.revenueUsd) * 100 : 0;

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 30 }}
                        className="bg-card border border-border rounded-xl p-5 space-y-4 card-glow"
                      >
                        {/* Product name + status badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${(p.active ?? p.isActive) ? "bg-success" : "bg-muted-foreground"}`} />
                            <span className="font-semibold text-foreground text-sm truncate">{p.name}</span>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${roasStatusClass(p.roas)}`}>
                            {p.roas >= 1.5 ? "Excelente" : p.roas >= 1.3 ? "Bueno" : p.roas >= 1.0 ? "Precaución" : "Alerta"}
                          </span>
                        </div>

                        {/* KPI grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                          <div>
                            <p className="label-caps mb-0.5">Facturado</p>
                            <p className="font-semibold text-foreground tabular">{formatUSD(p.revenueUsd)}</p>
                          </div>
                          <div>
                            <p className="label-caps mb-0.5">Invertido ads</p>
                            <p className="font-semibold text-muted-foreground tabular">{formatUSD(p.investmentUsd)}</p>
                          </div>
                          <div>
                            <p className="label-caps mb-0.5">Utilidad neta</p>
                            <p className={`font-semibold tabular ${profitStatusClass(p.profit)}`}>{formatUSD(p.profit)}</p>
                          </div>
                          <div>
                            <p className="label-caps mb-0.5">ROAS</p>
                            <p className={`font-semibold tabular ${p.roas >= 1.5 ? "status-green" : p.roas >= 1.0 ? "status-yellow" : "status-red"}`}>
                              {formatRoas(p.roas)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="label-caps mb-0.5">Margen neto</p>
                            <p className={`font-semibold tabular ${marginPct >= 20 ? "status-green" : marginPct >= 0 ? "status-yellow" : "status-red"}`}>
                              {formatPercent(p.profit / p.revenueUsd)}
                            </p>
                          </div>
                        </div>

                        {/* Revenue share progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="label-caps">% del total facturado</span>
                            <span className="text-xs font-semibold text-foreground tabular">{sharePercent.toFixed(1)}%</span>
                          </div>
                          <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${sharePercent}%` }}
                              transition={{ delay: i * 0.05 + 0.15, duration: 0.6, ease: "easeOut" }}
                              className="absolute inset-y-0 left-0 rounded-full bg-primary"
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <ProductModal
            product={editProduct}
            onClose={() => { setShowModal(false); setEditProduct(null); }}
            onSave={handleSave}
          />
        )}
        
      </AnimatePresence>
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: { product: any; onClose: () => void; onSave: (d: any) => void }) {
  const [name, setName] = useState(product?.name || "");
  const [price_usd, setPriceUsd] = useState(product?.price_usd != null ? String(product.price_usd) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name, price_usd });
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="pointer-events-auto bg-card border border-border rounded-xl w-full max-w-sm shadow-elevated flex flex-col"
          style={{ maxHeight: "85vh" }}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
            <h2 className="section-heading">{product ? "Editar Producto" : "Nuevo Producto"}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <form id="product-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 flex-1 overflow-y-auto min-h-0">
            <div className="space-y-1.5">
              <label className="label-caps">Nombre del producto</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Método MVP" className="form-input w-full" />
            </div>
            <div className="space-y-1.5">
              <label className="label-caps">Precio USD</label>
              <input type="number" min={0} step="0.01" value={price_usd} onChange={(e) => setPriceUsd(e.target.value)} placeholder="ej. 29.99" className="form-input w-full" />
            </div>
          </form>
          <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm hover:bg-accent transition-colors text-foreground">Cancelar</button>
            <button form="product-form" type="submit" className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Guardar</button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
