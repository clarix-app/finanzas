// ============================================================
// Ad Spend Page — Supabase-backed, USD only
// ============================================================

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useDailyRecords } from "@/hooks/useDailyRecords";
import { useProducts } from "@/hooks/useProducts";
import { formatUSD, MONTHS_ES } from "@/lib/calculations";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdSpendPage() {
  const { state } = useApp();
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterMonth, setFilterMonth] = useState(String(state.selectedMonth));
  const [filterYear, setFilterYear] = useState(String(state.selectedYear));

  const queryYear  = filterYear === "all"  ? state.selectedYear  : parseInt(filterYear);
  const queryMonth = filterMonth === "all" ? state.selectedMonth : parseInt(filterMonth);
  const { records, loading } = useDailyRecords(queryYear, queryMonth, state.selectedCountry);
  const { products, loading: loadingProducts } = useProducts();

  const normalised = useMemo(() => records.map((r: any) => ({
    id: r.id,
    date: r.date,
    productId:    r.product_id    ?? r.productId    ?? "",
    productName:  r.products?.name ?? r.productName  ?? "—",
    investmentUsd: r.ad_spend_usd ?? r.investmentUsd ?? 0,
    revenueUsd:    r.revenue_usd   ?? r.revenueUsd   ?? 0,
    profit:        r.profit_usd    ?? r.profit        ?? 0,
    roas:          r.roas          ?? 0,
    platform:      r.platform      ?? "",
    notes:         r.notes         ?? "",
  })), [records]);

  const filtered = useMemo(() => {
    return normalised.filter((r) => {
      const productMatch  = filterProduct  === "all" || r.productId   === filterProduct;
      const platformMatch = filterPlatform === "all" || r.platform    === filterPlatform;
      return productMatch && platformMatch;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [normalised, filterProduct, filterPlatform]);

  const totalSpendUsd   = filtered.reduce((s, r) => s + r.investmentUsd, 0);
  const uniquePlatforms = [...new Set(normalised.map((r) => r.platform).filter(Boolean))];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="section-heading">Gastos Ads</h1>
        <p className="text-muted-foreground text-sm mt-1">Análisis detallado de inversión publicitaria · Valores en USD</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="form-input h-9 text-sm w-auto">
          <option value="all">Todos los años</option>
          <option value="2026">2026</option>
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="form-input h-9 text-sm w-auto">
          <option value="all">Todos los meses</option>
          {MONTHS_ES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} className="form-input h-9 text-sm w-auto">
          <option value="all">Todos los productos</option>
          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="form-input h-9 text-sm w-auto">
          <option value="all">Todas las plataformas</option>
          {uniquePlatforms.map((pl) => <option key={pl} value={pl}>{pl}</option>)}
        </select>
      </div>

      {/* Total */}
      <div className="bg-card rounded-xl card-glow p-5 flex items-center justify-between">
        <p className="label-caps">Total Inversión Filtrada (USD)</p>
        <p className="kpi-value text-foreground tabular">{formatUSD(totalSpendUsd)}</p>
      </div>

      {loading || loadingProducts ? (
        <LoadingSpinner message="Cargando gastos publicitarios..." />
      ) : (
        <div className="bg-card rounded-xl card-glow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Fecha", "Producto", "Inversión", "Facturación", "ROAS", "Utilidad", "Plataforma", "Notas"].map((h) => (
                    <th key={h} className="label-caps text-left px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="table-row-hover border-b border-border/50 last:border-0">
                    <td className="px-5 py-3.5 tabular text-muted-foreground">{r.date}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{r.productName}</td>
                    <td className="px-5 py-3.5 tabular text-foreground">{formatUSD(r.investmentUsd)}</td>
                    <td className="px-5 py-3.5 tabular text-muted-foreground">{formatUSD(r.revenueUsd)}</td>
                    <td className={`px-5 py-3.5 tabular font-semibold ${r.roas >= 1.5 ? "status-green" : r.roas >= 1.0 ? "status-yellow" : "status-red"}`}>
                      {r.roas.toFixed(2)}x
                    </td>
                    <td className={`px-5 py-3.5 tabular font-semibold ${r.profit >= 0 ? "status-green" : "status-red"}`}>
                      {formatUSD(r.profit)}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.platform || "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground max-w-[150px] truncate">{r.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Sin registros con los filtros seleccionados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
