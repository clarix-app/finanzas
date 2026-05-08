// ============================================================
// Rentabilidad MVP – Calculation Utilities (USD only)
// ============================================================

import type { DailyRecord, DaySummary, RoasStatus, ProfitStatus, CurrencyRate } from "@/types";

// ─── Currency Defaults (kept for backward compat, unused) ──
export const DEFAULT_CURRENCY_RATES: CurrencyRate[] = [];

export function getRate(_code: string, _rates: CurrencyRate[]): number {
  return 1; // Everything is USD
}

export function toUsd(amount: number, _currencyCode: string, _rates: CurrencyRate[]): number {
  return amount; // No conversion needed
}

// ─── Record computation ───────────────────────────────────
export function computeRecord(
  partial: Omit<DailyRecord, "roas" | "profit" | "margin" | "investmentUsd" | "revenueUsd" | "variableCostsUsd">,
  _rates: CurrencyRate[]
): DailyRecord {
  const investmentUsd = partial.investment;
  const revenueUsd = partial.revenue;
  const variableCostsUsd = partial.variableCosts;

  const roas = investmentUsd > 0 ? revenueUsd / investmentUsd : 0;
  const profit = revenueUsd - investmentUsd - variableCostsUsd;
  const margin = revenueUsd > 0 ? profit / revenueUsd : 0;

  return {
    ...partial,
    currencyCode: "USD",
    investmentUsd,
    revenueUsd,
    variableCostsUsd,
    roas,
    profit,
    margin,
  };
}

// ─── Day aggregation ──────────────────────────────────────
export function aggregateDay(date: string, records: DailyRecord[]): DaySummary {
  const totalInvestment = records.reduce((s, r) => s + r.investmentUsd, 0);
  const totalRevenue = records.reduce((s, r) => s + r.revenueUsd, 0);
  const totalVariableCosts = records.reduce((s, r) => s + r.variableCostsUsd, 0);
  const totalProfit = totalRevenue - totalInvestment - totalVariableCosts;
  const roas = totalInvestment > 0 ? totalRevenue / totalInvestment : 0;
  const dayNumber = parseInt(date.split("-")[2], 10);
  return {
    date,
    dayNumber,
    records,
    totalInvestment,
    totalRevenue,
    totalVariableCosts,
    totalProfit,
    roas,
    productCount: records.length,
  };
}

// ─── Status helpers ───────────────────────────────────────
export function roasStatus(roas: number): RoasStatus {
  if (roas >= 1.5) return "excellent";
  if (roas >= 1.3) return "good";
  if (roas >= 1.0) return "caution";
  if (roas > 0) return "warning";
  return "critical";
}

export function profitStatus(profit: number): ProfitStatus {
  if (profit > 0) return "positive";
  if (profit === 0) return "zero";
  return "negative";
}

export function roasStatusLabel(roas: number): string {
  const s = roasStatus(roas);
  const map: Record<RoasStatus, string> = {
    excellent: "Excelente",
    good: "Bueno",
    caution: "Precaución",
    warning: "Alerta",
    critical: "Crítico",
  };
  return map[s];
}

export function roasStatusClass(roas: number): string {
  const s = roasStatus(roas);
  const map: Record<RoasStatus, string> = {
    excellent: "bg-status-green",
    good: "bg-status-green",
    caution: "bg-status-yellow",
    warning: "bg-status-orange",
    critical: "bg-status-red",
  };
  return map[s];
}

export function profitStatusClass(profit: number): string {
  const s = profitStatus(profit);
  if (s === "positive") return "status-green";
  if (s === "zero") return "status-muted";
  return "status-red";
}

// ─── Formatters ───────────────────────────────────────────

/** Display CLP amounts divided by 1000, rounded to nearest integer */
export function formatKCLP(value: number): string {
  return Math.round(value / 1000).toLocaleString("es-CL");
}

/** Format amount based on country: CL = K CLP, others = USD */
export function formatMonto(monto: number, country: string): string {
  if (country === "CL") {
    return Math.round(monto / 1000).toLocaleString("es-CL");
  }
  return `$${monto.toFixed(2)}`;
}

/** Currency label based on country */
export function getCurrencyLabel(country: string): string {
  return country === "CL" ? "K CLP" : "USD";
}

export function formatUSD(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** @deprecated Use formatMonto */
export function formatOriginal(value: number, _currencyCode: string): string {
  return formatUSD(value);
}

/** @deprecated Use formatMonto */
export function formatCLP(value: number, compact = false): string {
  return formatUSD(value, compact);
}

export function formatRoas(value: number): string {
  return value.toFixed(2) + "x";
}

export function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + "%";
}

export const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function generateMonthDates(year: number, month: number): string[] {
  const count = daysInMonth(year, month);
  return Array.from({ length: count }, (_, i) => {
    const d = i + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  });
}
