// ============================================================
// Sales Page — Supabase-backed, USD only
// ============================================================

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatUSD, formatRoas, roasStatusClass, profitStatusClass, MONTHS_ES } from "@/lib/calculations";
import { useDailyRecords } from "@/hooks/useDailyRecords";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function SalesPage() {
  const { state } = useApp();
  const { records, loading, deleteRecord } = useDailyRecords(state.selectedYear, state.selectedMonth, state.selectedCountry);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const monthName = MONTHS_ES[state.selectedMonth - 1];

  const mapped = useMemo(() => records.map((r: any) => {
    const revUsd  = r.revenue_usd   ?? 0;
    const invUsd  = r.ad_spend_usd  ?? 0;
    const costUsd = r.variable_cost_usd ?? 0;
    const profit  = revUsd - invUsd - costUsd;
    const roas    = invUsd > 0 ? revUsd / invUsd : 0;
    return {
      id:          r.id,
      date:        r.date,
      productId:   r.product_id   ?? "",
      productName: r.products?.name ?? "—",
      invUsd,
      revUsd,
      costUsd,
      profit,
      roas,
    };
  }), [records]);

  const totalRevenue    = useMemo(() => mapped.reduce((s, r) => s + r.revUsd,  0), [mapped]);
  const totalInvestment = useMemo(() => mapped.reduce((s, r) => s + r.invUsd,  0), [mapped]);
  const totalVarCosts   = useMemo(() => mapped.reduce((s, r) => s + r.costUsd, 0), [mapped]);
  const totalProfit     = totalRevenue - totalInvestment - totalVarCosts;

  const byProduct = useMemo(() => {
    const map: Record<string, { name: string; revenueUsd: number; investmentUsd: number; profit: number; count: number }> = {};
    mapped.forEach((r) => {
      if (!map[r.productId]) map[r.productId] = { name: r.productName, revenueUsd: 0, investmentUsd: 0, profit: 0, count: 0 };
      map[r.productId].revenueUsd    += r.revUsd;
      map[r.productId].investmentUsd += r.invUsd;
      map[r.productId].profit        += r.profit;
      map[r.productId].count         += 1;
    });
    return Object.values(map).sort((a, b) => b.revenueUsd - a.revenueUsd);
  }, [mapped]);

  async function handleDelete(id: string) {
    await deleteRecord(id);
    setConfirmId(null);
  }

  if (loading) return <LoadingSpinner message="Cargando registros..." />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="section-heading">Ventas — {monthName} {state.selectedYear}</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen de facturación por producto · Valores en USD</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Facturación Total",  value: formatUSD(totalRevenue),    cls: "text-foreground" },
          { label: "Inversión Total",    value: formatUSD(totalInvestment), cls: "text-muted-foreground" },
          { label: "Utilidad Total",     value: formatUSD(totalProfit),     cls: profitStatusClass(totalProfit) },
        ].map((item) => (
          <div key={item.label} className="bg-card rounded-xl p-5 card-glow">
            <p className="label-caps mb-2">{item.label}</p>
            <p className={`kpi-value ${item.cls} tabular`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Table by product */}
      <div className="bg-card rounded-xl card-glow overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Ventas por Producto</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Producto", "Facturación", "Inversión", "Utilidad", "ROAS", "Registros", "Estado"].map((h) => (
                  <th key={h} className="label-caps text-left px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byProduct.map((p) => {
                const roas = p.investmentUsd > 0 ? p.revenueUsd / p.investmentUsd : 0;
                return (
                  <tr key={p.name} className="table-row-hover border-b border-border/50 last:border-0">
                    <td className="px-5 py-3.5 font-semibold text-foreground">{p.name}</td>
                    <td className="px-5 py-3.5 tabular text-foreground">{formatUSD(p.revenueUsd)}</td>
                    <td className="px-5 py-3.5 tabular text-muted-foreground">{formatUSD(p.investmentUsd)}</td>
                    <td className={`px-5 py-3.5 tabular font-semibold ${profitStatusClass(p.profit)}`}>{formatUSD(p.profit)}</td>
                    <td className={`px-5 py-3.5 tabular font-semibold ${roas >= 1.5 ? "status-green" : roas >= 1.0 ? "status-yellow" : "status-red"}`}>{formatRoas(roas)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{p.count}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roasStatusClass(roas)}`}>
                        {roas >= 1.5 ? "Excelente" : roas >= 1.3 ? "Bueno" : roas >= 1.0 ? "Precaución" : "Alerta"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {byProduct.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Sin datos para este período</div>
          )}
        </div>
      </div>

      {/* All records table */}
      <div className="bg-card rounded-xl card-glow overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Todos los Registros</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Fecha", "Producto", "Inversión", "Facturación", "ROAS", "Utilidad", ""].map((h) => (
                  <th key={h} className="label-caps text-left px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...mapped].sort((a, b) => b.date.localeCompare(a.date)).map((rec) => (
                <tr key={rec.id} className="table-row-hover border-b border-border/50 last:border-0">
                  <td className="px-5 py-3 text-muted-foreground tabular">{rec.date}</td>
                  <td className="px-5 py-3 text-foreground font-medium">{rec.productName}</td>
                  <td className="px-5 py-3 tabular text-muted-foreground">{formatUSD(rec.invUsd)}</td>
                  <td className="px-5 py-3 tabular text-foreground">{formatUSD(rec.revUsd)}</td>
                  <td className={`px-5 py-3 tabular font-semibold ${rec.roas >= 1.5 ? "status-green" : rec.roas >= 1.0 ? "status-yellow" : "status-red"}`}>
                    {formatRoas(rec.roas)}
                  </td>
                  <td className={`px-5 py-3 tabular font-semibold ${profitStatusClass(rec.profit)}`}>
                    {formatUSD(rec.profit)}
                  </td>
                  <td className="px-5 py-3">
                    {confirmId === rec.id ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleDelete(rec.id)}
                          className="text-[11px] font-semibold px-2 py-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                          Sí, eliminar
                        </button>
                        <button onClick={() => setConfirmId(null)}
                          className="text-[11px] font-semibold px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent transition-colors">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(rec.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar registro">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {mapped.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Sin registros para este período</div>
          )}
        </div>
      </div>
    </div>
  );
}
