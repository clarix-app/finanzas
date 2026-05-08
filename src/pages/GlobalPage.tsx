import { useState, useEffect, useMemo } from "react";
import { DollarSign, TrendingUp, Receipt, Sparkles, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { formatUSD, formatRoas, formatKCLP, MONTHS_ES } from "@/lib/calculations";
import KPICard from "@/components/dashboard/KPICard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useUsdtPurchases } from "@/hooks/useUsdtPurchases";
import UsdtWidget from "@/components/UsdtWidget";

interface CountryRow {
  country: string;
  factLocal: number;
  factUsd: number;
  adsUsd: number;
  profitUsd: number;
  roas: number;
  activeDays: number;
}

const COUNTRY_LABELS: Record<string, string> = {
  CL: "Chile",
  VE: "Venezuela",
  MX: "México",
  AR: "Argentina",
  EC: "Ecuador",
  PY: "Paraguay",
  CO: "Colombia",
  PE: "Perú",
  US: "Estados Unidos",
};

function roasBadge(roas: number, hasAds: boolean) {
  if (!hasAds) return <span className="text-xs text-muted-foreground">—</span>;
  let cls = "text-destructive";
  let label = "Crítico";
  if (roas >= 3) { cls = "text-green-600 dark:text-green-400"; label = "Excelente"; }
  else if (roas >= 2) { cls = "text-blue-600 dark:text-blue-400"; label = "Bueno"; }
  else if (roas >= 1) { cls = "text-yellow-600 dark:text-yellow-400"; label = "Alerta"; }
  return <span className={`text-xs font-semibold ${cls}`}>{roas.toFixed(2)}x · {label}</span>;
}

export default function GlobalPage() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clpRate, setClpRate] = useState(950);
  const [usdtByCountry, setUsdtByCountry] = useState<Record<string, number>>({});
  const [usdtSaving, setUsdtSaving] = useState<string | null>(null);

  const year = state.selectedYear;
  const month = state.selectedMonth;

  // Fetch all countries' records for the month
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const from = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const [recordsRes, rateRes, usdtRes] = await Promise.all([
        supabase
          .from("daily_records")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", from)
          .lte("date", to),
        supabase
          .from("currency_config")
          .select("rate_to_usd")
          .eq("user_id", user.id)
          .eq("currency_code", "CLP")
          .maybeSingle(),
        supabase
          .from("usdt_purchases")
          .select("country, amount")
          .eq("user_id", user.id)
          .eq("year", year)
          .eq("month", month),
      ]);

      if (cancelled) return;

      if (rateRes.data?.rate_to_usd) setClpRate(rateRes.data.rate_to_usd);
      setRecords(recordsRes.data || []);
      const usdtMap: Record<string, number> = {};
      for (const row of usdtRes.data || []) usdtMap[row.country] = row.amount;
      setUsdtByCountry(usdtMap);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user, year, month]);

  // Aggregate by country
  const countryRows = useMemo<CountryRow[]>(() => {
    const byCountry: Record<string, any[]> = {};
    for (const r of records) {
      const c = r.country || "CL";
      if (!byCountry[c]) byCountry[c] = [];
      byCountry[c].push(r);
    }

    return Object.entries(byCountry).map(([country, recs]) => {
      const factLocal = recs.reduce((s: number, r: any) => s + (r.revenue_original || 0), 0);
      const adsOriginal = recs.reduce((s: number, r: any) => s + (r.ad_spend_original || 0), 0);
      const costsOriginal = recs.reduce((s: number, r: any) => s + (r.variable_cost_original || 0), 0);

      const isCL = country === "CL";
      const factUsd = isCL ? factLocal / clpRate : factLocal;
      const adsUsd = isCL ? adsOriginal / clpRate : adsOriginal;
      const profitUsd = factUsd - adsUsd - (isCL ? costsOriginal / clpRate : costsOriginal);
      const roas = adsUsd > 0 ? factUsd / adsUsd : 0;

      const uniqueDays = new Set(recs.map((r: any) => r.date)).size;

      return { country, factLocal, factUsd, adsUsd, profitUsd, roas, activeDays: uniqueDays };
    }).sort((a, b) => b.factUsd - a.factUsd);
  }, [records, clpRate]);

  const totalUsdt = useMemo(() => Object.values(usdtByCountry).reduce((a, b) => a + b, 0), [usdtByCountry]);

  const saveUsdtForCountry = async (country: string, amount: number) => {
    if (!user) return;
    setUsdtSaving(country);
    await supabase.from('usdt_purchases').upsert({
      user_id: user.id, year, month, country, amount,
    }, { onConflict: 'user_id,year,month,country' });
    setUsdtByCountry(prev => ({ ...prev, [country]: amount }));
    setUsdtSaving(null);
  };

  const totals = useMemo(() => {
    const factUsd = countryRows.reduce((s, r) => s + r.factUsd, 0);
    const adsUsd = countryRows.reduce((s, r) => s + r.adsUsd, 0);
    const profitUsd = countryRows.reduce((s, r) => s + r.profitUsd, 0);
    const roas = adsUsd > 0 ? factUsd / adsUsd : 0;
    return { factUsd, adsUsd, profitUsd, roas };
  }, [countryRows]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header with month/year selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Resumen Global</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={month}
              onChange={(e) => dispatch({ type: "SET_MONTH", month: Number(e.target.value) })}
              className="appearance-none bg-card border border-border rounded-lg px-3 py-2 pr-8 text-sm text-foreground cursor-pointer"
            >
              {MONTHS_ES.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={year}
              onChange={(e) => dispatch({ type: "SET_YEAR", year: Number(e.target.value) })}
              className="appearance-none bg-card border border-border rounded-lg px-3 py-2 pr-8 text-sm text-foreground cursor-pointer"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={DollarSign} title="Fact Total USD" value={formatUSD(totals.factUsd, true)} />
        <KPICard icon={Receipt} title="Ads Total USD" value={formatUSD(totals.adsUsd, true)} />
        <KPICard icon={TrendingUp} title="Profit Total USD" value={formatUSD(totals.profitUsd, true)} valueClass={totals.profitUsd >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"} />
        <KPICard icon={Sparkles} title="ROAS Global" value={totals.adsUsd > 0 ? formatRoas(totals.roas) : "—"} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : countryRows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Sin datos para este mes</div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">País</th>
                <th className="text-right px-4 py-3 font-medium">Fact (local)</th>
                <th className="text-right px-4 py-3 font-medium">Fact (USD)</th>
                <th className="text-right px-4 py-3 font-medium">Ads (USD)</th>
                <th className="text-right px-4 py-3 font-medium">Profit (USD)</th>
                <th className="text-right px-4 py-3 font-medium">USDT</th>
                <th className="text-right px-4 py-3 font-medium">ROAS</th>
                <th className="text-right px-4 py-3 font-medium">Días activos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {countryRows.map((row) => (
                <tr key={row.country} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {COUNTRY_LABELS[row.country] || row.country}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {row.country === "CL"
                      ? `${formatKCLP(row.factLocal)} K CLP`
                      : formatUSD(row.factLocal)}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{formatUSD(row.factUsd)}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatUSD(row.adsUsd)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${row.profitUsd >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                    {formatUSD(row.profitUsd)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UsdtWidget
                      amount={usdtByCountry[row.country] ?? 0}
                      saving={usdtSaving === row.country}
                      onSave={(v) => saveUsdtForCountry(row.country, v)}
                      label=""
                    />
                  </td>
                  <td className="px-4 py-3 text-right">{roasBadge(row.roas, row.adsUsd > 0)}</td>
                  <td className="px-4 py-3 text-right text-foreground">{row.activeDays}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-semibold">
                <td className="px-4 py-3 text-foreground">TOTAL</td>
                <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                <td className="px-4 py-3 text-right text-foreground">{formatUSD(totals.factUsd)}</td>
                <td className="px-4 py-3 text-right text-foreground">{formatUSD(totals.adsUsd)}</td>
                <td className={`px-4 py-3 text-right ${totals.profitUsd >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                  {formatUSD(totals.profitUsd)}
                </td>
                <td className="px-4 py-3 text-right text-yellow-300 font-bold">${totalUsdt.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{roasBadge(totals.roas, totals.adsUsd > 0)}</td>
                <td className="px-4 py-3 text-right text-foreground">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
