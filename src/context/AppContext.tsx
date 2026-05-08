// ============================================================
// Rentabilidad MVP – App State Context (USD only)
// ============================================================

import React, { createContext, useContext, useReducer, useMemo } from "react";
import type {
  DailyRecord, Product, Platform, AdAccount, AppConfig, DaySummary, AppPage,
} from "@/types";
import {
  sampleRecords, sampleProducts, samplePlatforms, sampleAccounts,
} from "@/data/sampleData";
import { aggregateDay, generateMonthDates } from "@/lib/calculations";

// ─── State ────────────────────────────────────────────────
interface AppState {
  records: DailyRecord[];
  products: Product[];
  platforms: Platform[];
  accounts: AdAccount[];
  config: AppConfig;
  selectedYear: number;
  selectedMonth: number;
  selectedCountry: string;
  currentPage: AppPage;
}

// ─── Actions ──────────────────────────────────────────────
type Action =
  | { type: "SET_PAGE"; page: AppPage }
  | { type: "SET_YEAR"; year: number }
  | { type: "SET_MONTH"; month: number }
  | { type: "SET_COUNTRY"; country: string }
  | { type: "ADD_RECORD"; record: DailyRecord }
  | { type: "UPDATE_RECORD"; record: DailyRecord }
  | { type: "DELETE_RECORD"; id: string }
  | { type: "IMPORT_RECORDS"; records: DailyRecord[] }
  | { type: "ADD_PRODUCT"; product: Product }
  | { type: "UPDATE_PRODUCT"; product: Product }
  | { type: "DELETE_PRODUCT"; id: string }
  | { type: "UPDATE_CONFIG"; config: Partial<AppConfig> };

const initialConfig: AppConfig = {
  currency: "USD",
  currencySymbol: "$",
  roasObjective: 2.0,
  roasMinimum: 1.5,
  profitThreshold: 0,
  taxRate: 0,
  currencyRates: [],
};

const initialState: AppState = {
  records: sampleRecords,
  products: sampleProducts,
  platforms: samplePlatforms,
  accounts: sampleAccounts,
  config: initialConfig,
  selectedYear: 2026,
  selectedMonth: 2,
  selectedCountry: typeof window !== "undefined"
    ? localStorage.getItem("selectedCountry") ?? "CL"
    : "CL",
  currentPage: "dashboard",
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, currentPage: action.page };
    case "SET_YEAR":
      return { ...state, selectedYear: action.year };
    case "SET_MONTH":
      return { ...state, selectedMonth: action.month };
    case "SET_COUNTRY":
      return { ...state, selectedCountry: action.country };
    case "ADD_RECORD":
      return { ...state, records: [...state.records, action.record] };
    case "UPDATE_RECORD":
      return {
        ...state,
        records: state.records.map((r) => r.id === action.record.id ? action.record : r),
      };
    case "DELETE_RECORD":
      return { ...state, records: state.records.filter((r) => r.id !== action.id) };
    case "IMPORT_RECORDS":
      return { ...state, records: [...state.records, ...action.records] };
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.product] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) => p.id === action.product.id ? action.product : p),
      };
    case "DELETE_PRODUCT":
      return { ...state, products: state.products.filter((p) => p.id !== action.id) };
    case "UPDATE_CONFIG":
      return { ...state, config: { ...state.config, ...action.config } };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentMonthDays: DaySummary[];
  currentMonthRecords: DailyRecord[];
  totalInvestment: number;
  totalRevenue: number;
  totalProfit: number;
  totalRoas: number;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const currentMonthRecords = useMemo(() =>
    state.records.filter((r) => {
      const [y, m] = r.date.split("-");
      return parseInt(y) === state.selectedYear && parseInt(m) === state.selectedMonth;
    }),
    [state.records, state.selectedYear, state.selectedMonth]
  );

  const currentMonthDays = useMemo(() => {
    const dates = generateMonthDates(state.selectedYear, state.selectedMonth);
    return dates.map((date) => {
      const dayRecords = currentMonthRecords.filter((r) => r.date === date);
      return aggregateDay(date, dayRecords);
    });
  }, [currentMonthRecords, state.selectedYear, state.selectedMonth]);

  const totalInvestment = useMemo(() =>
    currentMonthRecords.reduce((s, r) => s + r.investmentUsd, 0),
    [currentMonthRecords]
  );
  const totalRevenue = useMemo(() =>
    currentMonthRecords.reduce((s, r) => s + r.revenueUsd, 0),
    [currentMonthRecords]
  );
  const totalVariableCosts = useMemo(() =>
    currentMonthRecords.reduce((s, r) => s + r.variableCostsUsd, 0),
    [currentMonthRecords]
  );
  const totalProfit = totalRevenue - totalInvestment - totalVariableCosts;
  const totalRoas = totalInvestment > 0 ? totalRevenue / totalInvestment : 0;

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      currentMonthDays,
      currentMonthRecords,
      totalInvestment,
      totalRevenue,
      totalProfit,
      totalRoas,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
