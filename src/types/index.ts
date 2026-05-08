// ============================================================
// Rentabilidad MVP – Core TypeScript Types
// ============================================================

export interface Product {
  id: string;
  name: string;
  basePrice?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Platform {
  id: string;
  name: string;
}

export interface AdAccount {
  id: string;
  name: string;
  platformId: string;
}

export interface CurrencyRate {
  code: string;   // "CLP" | "ARS" | "VES"
  name: string;
  rateToUsd: number; // how many units = 1 USD
}

export interface DailyRecord {
  id: string;
  date: string; // ISO "YYYY-MM-DD"
  productId: string;
  productName: string;
  // Original values (in currencyCode)
  currencyCode: string;
  investment: number;      // original
  revenue: number;         // original
  variableCosts: number;   // original
  // USD-converted values
  investmentUsd: number;
  revenueUsd: number;
  variableCostsUsd: number;
  platform?: string;
  accountId?: string;
  notes?: string;
  // Derived (computed, always in USD)
  roas: number;
  profit: number;   // profitUsd
  margin: number;
}

export interface DaySummary {
  date: string;
  dayNumber: number;
  records: DailyRecord[];
  totalInvestment: number;      // USD
  totalRevenue: number;         // USD
  totalVariableCosts: number;   // USD
  totalProfit: number;          // USD
  roas: number;
  productCount: number;
}

export interface MonthSummary {
  year: number;
  month: number; // 1–12
  days: DaySummary[];
  totalInvestment: number;
  totalRevenue: number;
  totalVariableCosts: number;
  totalProfit: number;
  roas: number;
  activeDays: number;
  profitableDays: number;
}

export interface AppConfig {
  currency: string;
  currencySymbol: string;
  roasObjective: number;
  roasMinimum: number;
  profitThreshold: number;
  taxRate: number;
  currencyRates: CurrencyRate[];
}

export type RoasStatus = "excellent" | "good" | "caution" | "warning" | "critical";
export type ProfitStatus = "positive" | "zero" | "negative";

export type AppPage =
  | "dashboard"
  | "global"
  | "ventas"
  | "productos"
  | "gastos-ads"
  | "cuentas"
  | "plataformas"
  | "analisis"
  | "importar"
  | "configuracion";
