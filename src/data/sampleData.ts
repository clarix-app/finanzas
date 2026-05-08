// ============================================================
// Rentabilidad MVP – Sample Data (Febrero 2026) — USD only
// ============================================================

import type { DailyRecord, Product, Platform, AdAccount } from "@/types";
import { computeRecord } from "@/lib/calculations";

export const sampleProducts: Product[] = [
  { id: "p1", name: "PACL BASE", basePrice: 19.99, isActive: true, createdAt: "2026-01-01" },
  { id: "p2", name: "Megapack Crochetero", basePrice: 24.99, isActive: true, createdAt: "2026-01-01" },
  { id: "p3", name: "FRYERBOOK", basePrice: 14.99, isActive: true, createdAt: "2026-01-01" },
  { id: "p4", name: "Método MVP", basePrice: 39.99, isActive: true, createdAt: "2026-01-01" },
  { id: "p5", name: "Plan Maestro Keto 360", basePrice: 29.99, isActive: true, createdAt: "2026-01-01" },
];

export const samplePlatforms: Platform[] = [
  { id: "pl1", name: "Meta Ads" },
  { id: "pl2", name: "Google Ads" },
  { id: "pl3", name: "TikTok Ads" },
];

export const sampleAccounts: AdAccount[] = [
  { id: "ac1", name: "Cuenta Principal Meta", platformId: "pl1" },
  { id: "ac2", name: "Google Search", platformId: "pl2" },
  { id: "ac3", name: "TikTok Ventas", platformId: "pl3" },
];

function rec(
  date: string,
  productId: string,
  productName: string,
  investment: number,
  revenue: number,
  variableCosts: number = 0,
  platform = "Meta Ads",
  accountId = "ac1"
): DailyRecord {
  return computeRecord({
    id: `${date}-${productId}`,
    date,
    productId,
    productName,
    currencyCode: "USD",
    investment,
    revenue,
    variableCosts,
    platform,
    accountId,
    notes: "",
  }, []);
}

export const sampleRecords: DailyRecord[] = [
  rec("2026-02-01", "p1", "PACL BASE",            85, 280, 35, "Meta Ads",   "ac1"),
  rec("2026-02-01", "p3", "FRYERBOOK",            52, 195, 20, "Google Ads", "ac2"),
  rec("2026-02-02", "p2", "Megapack Crochetero", 120, 450, 45, "Meta Ads",   "ac1"),
  rec("2026-02-02", "p5", "Plan Maestro Keto 360",95, 380, 50, "Meta Ads",   "ac1"),
  rec("2026-02-03", "p4", "Método MVP",          180, 720, 60, "Meta Ads",   "ac1"),
  rec("2026-02-03", "p1", "PACL BASE",            70, 210, 30, "Google Ads", "ac2"),
  rec("2026-02-03", "p3", "FRYERBOOK",            42, 128, 18, "TikTok Ads", "ac3"),
  rec("2026-02-04", "p1", "PACL BASE",            60, 125, 20, "Meta Ads",   "ac1"),
  rec("2026-02-04", "p2", "Megapack Crochetero",  50,  90, 10, "Meta Ads",   "ac1"),
  rec("2026-02-05", "p5", "Plan Maestro Keto 360",110, 440, 55, "Meta Ads",  "ac1"),
  rec("2026-02-05", "p4", "Método MVP",          220, 880, 70, "Google Ads", "ac2"),
  rec("2026-02-05", "p3", "FRYERBOOK",            62, 124, 25, "Meta Ads",   "ac1"),
  rec("2026-02-05", "p1", "PACL BASE",            40, 135, 20, "Meta Ads",   "ac1"),
  rec("2026-02-06", "p2", "Megapack Crochetero",  75, 275, 25, "Meta Ads",   "ac1"),
  rec("2026-02-06", "p5", "Plan Maestro Keto 360",80, 200, 30, "TikTok Ads", "ac3"),
  rec("2026-02-07", "p4", "Método MVP",          250,1050, 80, "Meta Ads",   "ac1"),
  rec("2026-02-07", "p1", "PACL BASE",            90, 360, 40, "Meta Ads",   "ac1"),
  rec("2026-02-07", "p2", "Megapack Crochetero",  60, 225, 30, "Meta Ads",   "ac1"),
  rec("2026-02-08", "p3", "FRYERBOOK",            55, 198, 22, "Google Ads", "ac2"),
  rec("2026-02-08", "p4", "Método MVP",          150, 580, 55, "Meta Ads",   "ac1"),
  rec("2026-02-08", "p5", "Plan Maestro Keto 360",75, 270, 35, "Meta Ads",   "ac1"),
  rec("2026-02-08", "p1", "PACL BASE",            50, 165, 25, "Meta Ads",   "ac1"),
  rec("2026-02-09", "p2", "Megapack Crochetero", 190, 520, 55, "Meta Ads",   "ac1"),
  rec("2026-02-09", "p4", "Método MVP",          200, 820, 75, "Meta Ads",   "ac1"),
  rec("2026-02-10", "p1", "PACL BASE",            95, 380, 40, "Meta Ads",   "ac1"),
  rec("2026-02-10", "p3", "FRYERBOOK",            70, 250, 30, "Google Ads", "ac2"),
  rec("2026-02-10", "p5", "Plan Maestro Keto 360",120, 470, 50, "Meta Ads",  "ac1"),
];
