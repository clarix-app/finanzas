// ============================================================
// Platforms Page
// ============================================================

import { useApp } from "@/context/AppContext";
import { Globe, TrendingUp } from "lucide-react";
import { formatCLP } from "@/lib/calculations";

export default function PlatformsPage() {
  const { state } = useApp();

  const platformStats = state.platforms.map((p) => {
    const records = state.records.filter((r) => r.platform === p.name);
    const investment = records.reduce((s, r) => s + r.investment, 0);
    const revenue = records.reduce((s, r) => s + r.revenue, 0);
    const profit = records.reduce((s, r) => s + r.profit, 0);
    const roas = investment > 0 ? revenue / investment : 0;
    return { ...p, investment, revenue, profit, roas, count: records.length };
  });

  const totalInvestment = platformStats.reduce((s, p) => s + p.investment, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="section-heading">Plataformas</h1>
        <p className="text-muted-foreground text-sm mt-1">Rendimiento por plataforma publicitaria</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platformStats.map((p) => {
          const share = totalInvestment > 0 ? (p.investment / totalInvestment) * 100 : 0;
          return (
            <div key={p.id} className="bg-card rounded-xl card-glow p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">{p.name}</p>
                </div>
                <span className="text-muted-foreground text-xs">{p.count} registros</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Inversión</span>
                  <span className="text-foreground tabular font-medium">{formatCLP(p.investment)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Facturación</span>
                  <span className="text-foreground tabular font-medium">{formatCLP(p.revenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ROAS</span>
                  <span className={`tabular font-semibold ${p.roas >= 1.5 ? "status-green" : p.roas >= 1.0 ? "status-yellow" : "status-red"}`}>
                    {p.roas.toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Utilidad</span>
                  <span className={`tabular font-semibold ${p.profit >= 0 ? "status-green" : "status-red"}`}>
                    {formatCLP(p.profit)}
                  </span>
                </div>
              </div>

              {/* Share bar */}
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Participación de inversión</span>
                  <span>{share.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
