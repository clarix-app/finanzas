// ============================================================
// Dashboard Page — Supabase-backed + Google Sheets auto-sync
// ============================================================

import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DollarSign, Receipt, TrendingUp, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Sheet, ChevronDown } from "lucide-react";
import ImportadorBancoEstado from "@/components/ImportadorBancoEstado";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useGoogleSheetSync } from "@/hooks/useGoogleSheetSync";
import { supabase } from "@/lib/supabase";
import {
  formatUSD, formatKCLP, formatMonto, getCurrencyLabel, formatRoas, formatPercent, MONTHS_ES, profitStatusClass,
  aggregateDay, generateMonthDates,
} from "@/lib/calculations";
import KPICard from "@/components/dashboard/KPICard";
import DayRow from "@/components/dashboard/DayRow";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { useDailyRecords } from "@/hooks/useDailyRecords";
import { useUsdtPurchases } from "@/hooks/useUsdtPurchases";
import UsdtWidget from "@/components/UsdtWidget";

export default function DashboardPage() {
  const { state } = useApp();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showBEImporter, setShowBEImporter] = useState(false);
  const { amount: usdtAmount, saving: usdtSaving, save: saveUsdt } = useUsdtPurchases(
    state.selectedYear, state.selectedMonth, state.selectedCountry, user?.id
  );

  const { records, loading, addRecord, deleteRecord, updateRecord } = useDailyRecords(
    state.selectedYear,
    state.selectedMonth,
    state.selectedCountry,
  );

  // ── Google Sheets auto-sync ──────────────────────────────
  const { sync, status: syncStatus, lastResult } = useGoogleSheetSync(state.selectedCountry);
  const hasSynced = useRef(false);
  const [showSyncBanner, setShowSyncBanner] = useState(false);

  useEffect(() => {
    if (!user || hasSynced.current) return;
    hasSynced.current = true;

    supabase
      .from("profiles")
      .select("google_sheet_url")
      .eq("id", user.id)
      .single()
      .then(async ({ data }) => {
        const url = data?.google_sheet_url;
        if (!url) return;
        setShowSyncBanner(true);
        await sync(url);
        // Hide success banner after 4s
        setTimeout(() => setShowSyncBanner(false), 4000);
      });
  }, [user, sync]);
  // ────────────────────────────────────────────────────────

  const monthName = MONTHS_ES[state.selectedMonth - 1];

  const currentMonthDays = useMemo(() => {
    const dates = generateMonthDates(state.selectedYear, state.selectedMonth);
    return dates.map((date) => {
      const dayRecords = records.filter((r: any) => r.date === date);
      const mapped = dayRecords.map((r: any) => {
        const revUsd = r.revenue_usd ?? 0;
        const invUsd = r.ad_spend_usd ?? 0;
        const profitVal = revUsd - invUsd;
        return {
          id: r.id,
          date: r.date,
          productId: r.product_id ?? "",
          productName: r.products?.name ?? "—",
          currencyCode: r.currency_code ?? "CLP",
          investment: r.ad_spend_original ?? 0,
          revenue: r.revenue_original ?? 0,
          variableCosts: r.variable_cost_original ?? 0,
          variableCostsUsd: r.variable_cost_usd ?? 0,
          investmentUsd: invUsd,
          revenueUsd: revUsd,
          profit: profitVal,
          roas: invUsd > 0 ? revUsd / invUsd : 0,
          margin: revUsd > 0 ? profitVal / revUsd : 0,
          platform: r.platform ?? "",
          accountId: r.account_id ?? "",
          notes: r.notes ?? "",
        };
      });
      return aggregateDay(date, mapped);
    });
  }, [records, state.selectedYear, state.selectedMonth, state.config.currencyRates]);

  const totalInvestment = useMemo(() => records.reduce((s: number, r: any) => s + (r.ad_spend_usd ?? 0), 0), [records]);
  const totalRevenue    = useMemo(() => records.reduce((s: number, r: any) => s + (r.revenue_usd ?? 0), 0), [records]);
  const totalVarCosts   = useMemo(() => records.reduce((s: number, r: any) => s + (r.variable_cost_usd ?? 0), 0), [records]);
  const totalProfit  = totalRevenue - totalInvestment;
  const totalRoas    = totalInvestment > 0 ? totalRevenue / totalInvestment : 0;
  const margin       = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

  const daysWithData = useMemo(() => currentMonthDays.filter(d => d.records.length > 0), [currentMonthDays]);

  const filteredDays = useMemo(() =>
    currentMonthDays.filter(d =>
      !search ||
      d.records.some(r => r.productName.toLowerCase().includes(search.toLowerCase())) ||
      String(d.dayNumber).includes(search)
    ),
    [currentMonthDays, search]
  );


  return (
    <div className="p-6 space-y-8">

      {/* ── Google Sheets Sync Banner ───────────────────── */}
      <AnimatePresence>
        {showSyncBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${
              syncStatus === "syncing"
                ? "bg-primary/5 border-primary/20 text-primary"
                : syncStatus === "error"
                ? "bg-destructive/5 border-destructive/20 text-destructive"
                : "bg-success/5 border-success/20 text-success"
            }`}
          >
            {syncStatus === "syncing" && (
              <>
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>Sincronizando con Google Sheets...</span>
              </>
            )}
            {syncStatus === "success" && (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Sincronización completada —{" "}
                  <strong>{lastResult?.inserted ?? 0}</strong> filas nuevas importadas
                  {lastResult?.skipped ? `, ${lastResult.skipped} duplicadas omitidas` : ""}
                </span>
                <Sheet className="w-4 h-4 ml-auto shrink-0 opacity-60" />
              </>
            )}
            {syncStatus === "error" && (
              <>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lastResult?.error ?? "Error al sincronizar con Google Sheets"}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard index={0} title="Inversión Total Ads" value={formatMonto(totalInvestment, state.selectedCountry)}
            subtitle={`${getCurrencyLabel(state.selectedCountry)} · ${daysWithData.length} días activos`} icon={DollarSign} currencyLabel={getCurrencyLabel(state.selectedCountry)} />
          <KPICard index={1} title="Facturación Total" value={formatMonto(totalRevenue, state.selectedCountry)}
            subtitle={`${getCurrencyLabel(state.selectedCountry)} · Margen: ${formatPercent(margin)}`} icon={Receipt} currencyLabel={getCurrencyLabel(state.selectedCountry)} />
          <KPICard index={2} title="ROAS Total" value={totalInvestment > 0 ? formatRoas(totalRoas) : "—"}
            subtitle="Facturación / Inversión" icon={TrendingUp}
            valueClass={totalInvestment > 0 ? (totalRoas >= 3 ? "text-green-400" : totalRoas >= 2 ? "text-blue-400" : totalRoas >= 1 ? "text-yellow-400" : "text-red-400") : "text-muted-foreground"} />
          <KPICard index={3} title="Utilidad Real ★" value={formatMonto(totalProfit, state.selectedCountry)}
            subtitle={`${getCurrencyLabel(state.selectedCountry)} · La métrica que importa`} icon={Sparkles} valueClass={profitStatusClass(totalProfit)} currencyLabel={getCurrencyLabel(state.selectedCountry)} />
        </div>

        {totalProfit > 0 && (
          <div className="mt-4 bg-success/5 border border-success/20 rounded-xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
              <span className="text-success text-sm font-semibold">Mes rentable</span>
              <span className="text-muted-foreground text-sm">
                {formatMonto(totalProfit, state.selectedCountry)} {getCurrencyLabel(state.selectedCountry)} de utilidad — Margen {formatPercent(margin)}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">ROAS {formatRoas(totalRoas)}</span>
          </div>
        )}
        {totalProfit < 0 && (
          <div className="mt-4 bg-destructive/5 border border-destructive/20 rounded-xl px-5 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse-soft" />
            <span className="text-destructive text-sm font-semibold">Mes en pérdida</span>
            <span className="text-muted-foreground text-sm">{formatMonto(totalProfit, state.selectedCountry)} {getCurrencyLabel(state.selectedCountry)} de utilidad</span>
          </div>
        )}
      </section>

      {/* ── USDT Comprado ──────────────────────────────── */}
      <UsdtWidget amount={usdtAmount} saving={usdtSaving} onSave={saveUsdt} label="$$$" />

      {/* ── Importar BancoEstado (collapsible) ──────────── */}
      <section>
        <button
          onClick={() => setShowBEImporter(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showBEImporter ? "rotate-180" : ""}`} />
          Importar Excel BancoEstado
        </button>
        <AnimatePresence>
          {showBEImporter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mt-3"
            >
              <ImportadorBancoEstado />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Daily Data Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading">
              Datos Diarios — {monthName} {state.selectedYear}
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              {daysWithData.length} de {currentMonthDays.length} días con datos · Valores en {getCurrencyLabel(state.selectedCountry)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar día o producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input w-52 h-9 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Cargando registros diarios..." />
        ) : (
          <div className="space-y-1.5">
            {filteredDays.map((day, i) => (
              <DayRow
                key={day.date}
                day={day}
                index={i}
                onDelete={deleteRecord}
                onUpdate={updateRecord}
                onAdd={addRecord}
                country={state.selectedCountry}
              />
            ))}
            {filteredDays.every(d => d.records.length === 0) && (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Sin registros para {monthName} {state.selectedYear}. Haz clic en un día para agregar datos.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
