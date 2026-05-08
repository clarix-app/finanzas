// ============================================================
// Analysis Page
// ============================================================

import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend,
} from "recharts";
import { useApp } from "@/context/AppContext";
import {
  formatUSD, formatRoas, profitStatusClass, roasStatusClass, MONTHS_ES,
} from "@/lib/calculations";

export default function AnalysisPage() {
  const { state, currentMonthDays, totalInvestment, totalRevenue, totalProfit, totalRoas } = useApp();
  const monthName = MONTHS_ES[state.selectedMonth - 1];

  // Daily chart data – values in USD
  const dailyChartData = useMemo(() =>
    currentMonthDays
      .filter((d) => d.records.length > 0)
      .map((d) => ({
        day: `Día ${d.dayNumber}`,
        Inversión: parseFloat(d.totalInvestment.toFixed(2)),
        Facturación: parseFloat(d.totalRevenue.toFixed(2)),
        Utilidad: parseFloat(d.totalProfit.toFixed(2)),
        ROAS: parseFloat(d.roas.toFixed(2)),
      })),
    [currentMonthDays]
  );

  // Product bar data – USD
  const productBarData = useMemo(() => {
    const map: Record<string, { name: string; investment: number; revenue: number; profit: number }> = {};
    state.records.forEach((r) => {
      const [y, m] = r.date.split("-");
      if (parseInt(y) !== state.selectedYear || parseInt(m) !== state.selectedMonth) return;
      if (!map[r.productId]) map[r.productId] = { name: r.productName, investment: 0, revenue: 0, profit: 0 };
      map[r.productId].investment += r.investmentUsd;
      map[r.productId].revenue += r.revenueUsd;
      map[r.productId].profit += r.profit;
    });
    return Object.values(map).sort((a, b) => b.profit - a.profit);
  }, [state.records, state.selectedYear, state.selectedMonth]);

  // Summary stats
  const profitableDays = currentMonthDays.filter((d) => d.totalProfit > 0).length;
  const negativeDays = currentMonthDays.filter((d) => d.records.length > 0 && d.totalProfit < 0).length;
  const bestDay = currentMonthDays.reduce((best, d) => d.totalProfit > (best?.totalProfit || -Infinity) ? d : best, currentMonthDays[0]);
  const worstDay = currentMonthDays.filter((d) => d.records.length > 0).reduce((worst, d) => d.totalProfit < (worst?.totalProfit || Infinity) ? d : worst, currentMonthDays.find(d => d.records.length > 0) || currentMonthDays[0]);
  const bestProduct = productBarData[0];
  const worstProduct = productBarData[productBarData.length - 1];

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "hsl(240 10% 8%)",
      border: "1px solid hsl(240 5% 15%)",
      borderRadius: "8px",
      color: "hsl(240 5% 90%)",
      fontSize: "12px",
    },
    labelStyle: { color: "hsl(240 4% 50%)" },
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="section-heading">Análisis — {monthName} {state.selectedYear}</h1>
        <p className="text-muted-foreground text-sm mt-1">Inteligencia financiera del período · Valores en USD</p>
      </div>

      {/* Key insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Días rentables", value: String(profitableDays), sub: `de ${currentMonthDays.filter(d => d.records.length > 0).length} activos`, cls: "status-green" },
          { label: "Días en pérdida", value: String(negativeDays), sub: "días negativos", cls: negativeDays > 0 ? "status-red" : "status-muted" },
          { label: "Mejor día", value: bestDay?.records.length > 0 ? `Día ${bestDay.dayNumber}` : "—", sub: bestDay?.records.length > 0 ? formatUSD(bestDay.totalProfit) : "", cls: "status-green" },
          { label: "Peor día", value: worstDay?.records.length > 0 ? `Día ${worstDay.dayNumber}` : "—", sub: worstDay?.records.length > 0 ? formatUSD(worstDay.totalProfit) : "", cls: "status-red" },
        ].map((item) => (
          <div key={item.label} className="bg-card rounded-xl card-glow p-5">
            <p className="label-caps mb-2">{item.label}</p>
            <p className={`text-2xl font-bold tabular ${item.cls}`}>{item.value}</p>
            {item.sub && <p className="text-muted-foreground text-xs mt-1">{item.sub}</p>}
          </div>
        ))}
      </div>

      {/* Products ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bestProduct && (
          <div className="bg-card rounded-xl card-glow p-5">
            <p className="label-caps mb-3">Producto más rentable</p>
            <p className="text-foreground font-semibold text-lg">{bestProduct.name}</p>
            <p className="status-green font-bold tabular text-xl mt-1">{formatUSD(bestProduct.profit)}</p>
            <p className="text-muted-foreground text-xs mt-1">ROAS: {bestProduct.investment > 0 ? (bestProduct.revenue / bestProduct.investment).toFixed(2) : "—"}x</p>
          </div>
        )}
        {worstProduct && worstProduct !== bestProduct && (
          <div className="bg-card rounded-xl card-glow p-5">
            <p className="label-caps mb-3">Producto menos rentable</p>
            <p className="text-foreground font-semibold text-lg">{worstProduct.name}</p>
            <p className={`font-bold tabular text-xl mt-1 ${worstProduct.profit >= 0 ? "status-green" : "status-red"}`}>
              {formatUSD(worstProduct.profit)}
            </p>
            <p className="text-muted-foreground text-xs mt-1">ROAS: {worstProduct.investment > 0 ? (worstProduct.revenue / worstProduct.investment).toFixed(2) : "—"}x</p>
          </div>
        )}
      </div>

      {/* Daily evolution chart */}
      {dailyChartData.length > 0 && (
        <div className="bg-card rounded-xl card-glow p-5">
          <h3 className="text-sm font-semibold text-foreground mb-5">Evolución Diaria — Inversión vs Facturación (USD)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyChartData}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(250 80% 70%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(250 80% 70%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradInvestment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "hsl(240 4% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(240 4% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => formatUSD(v)} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(240 4% 50%)" }} />
              <Area type="monotone" dataKey="Facturación" stroke="hsl(250 80% 70%)" strokeWidth={2} fill="url(#gradRevenue)" dot={false} />
              <Area type="monotone" dataKey="Inversión" stroke="hsl(142 71% 45%)" strokeWidth={2} fill="url(#gradInvestment)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Utility by product bar chart */}
      {productBarData.length > 0 && (
        <div className="bg-card rounded-xl card-glow p-5">
          <h3 className="text-sm font-semibold text-foreground mb-5">Utilidad por Producto (USD)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "hsl(240 4% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(240 4% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => formatUSD(v)} />
              <Bar dataKey="profit" name="Utilidad" fill="hsl(250 80% 70%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ROAS daily line chart */}
      {dailyChartData.length > 0 && (
        <div className="bg-card rounded-xl card-glow p-5">
          <h3 className="text-sm font-semibold text-foreground mb-5">ROAS Diario</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "hsl(240 4% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(240 4% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => v.toFixed(2) + "x"} />
              <Line type="monotone" dataKey="ROAS" stroke="hsl(250 80% 70%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
