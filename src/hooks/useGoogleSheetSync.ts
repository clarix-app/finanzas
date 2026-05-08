// ============================================================
// Google Sheets Sync Hook — USD only
// ============================================================

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncResult {
  inserted: number;
  skipped: number;
  error?: string;
}

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return null;
}

function parseGvizResponse(text: string): string[][] | null {
  try {
    const jsonStr = text
      .replace(/^[^{]*/, "")
      .replace(/\);?\s*$/, "")
      .trim();
    const json = JSON.parse(jsonStr);
    const rows: any[] = json?.table?.rows ?? [];
    return rows.map((row: any) =>
      (row.c ?? []).map((cell: any) => {
        if (cell == null) return "";
        if (cell.v == null) return "";
        return String(cell.v).trim();
      })
    );
  } catch {
    return null;
  }
}

export function useGoogleSheetSync(selectedCountry: string) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const sync = useCallback(async (sheetUrl: string): Promise<SyncResult> => {
    setStatus("syncing");

    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      const result: SyncResult = { inserted: 0, skipped: 0, error: "URL de Google Sheet inválida" };
      setLastResult(result);
      setStatus("error");
      return result;
    }

    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
      const resp = await fetch(gvizUrl);
      if (!resp.ok) {
        throw new Error(
          `No se pudo acceder al Google Sheet (HTTP ${resp.status}). Asegúrate de que la hoja está compartida públicamente.`
        );
      }

      const text = await resp.text();
      const dataRows = parseGvizResponse(text);

      if (!dataRows || dataRows.length === 0) {
        const result: SyncResult = { inserted: 0, skipped: 0 };
        setLastResult(result);
        setStatus("success");
        return result;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: existingProducts } = await supabase
        .from("products")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("active", true);

      const productMap = new Map<string, string>(
        (existingProducts ?? []).map((p: any) => [p.name.toLowerCase(), p.id])
      );

      async function getOrCreateProduct(name: string): Promise<string | null> {
        const key = name.toLowerCase().trim();
        if (productMap.has(key)) return productMap.get(key)!;

        const { data, error } = await supabase
          .from("products")
          .insert({ name: name.trim(), user_id: user!.id, active: true })
          .select("id")
          .maybeSingle();

        if (error || !data) return null;
        productMap.set(key, data.id);
        return data.id;
      }

      const { data: existingRecords } = await supabase
        .from("daily_records")
        .select("date, revenue_original, notes")
        .eq("user_id", user.id)
        .eq("source", "google_sheets")
        .eq("country", selectedCountry);

      const existingKeys = new Set<string>(
        (existingRecords ?? []).map((r: any) => {
          const noteProduct = (r.notes ?? "").split(" — ")[0].toLowerCase().trim();
          return `${r.date}|${noteProduct}|${r.revenue_original}`;
        })
      );

      const toInsert: any[] = [];
      let skipped = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const cols = dataRows[i];
        const rawDate = cols[0] ?? "";
        if (!rawDate || rawDate.toLowerCase().includes("fecha")) { skipped++; continue; }

        const rawProduct = (cols[1] ?? "").trim();
        const rawAmount  = cols[2] ?? "";
        const rawStatus  = cols[3] ?? "";

        const date = parseDate(rawDate);
        if (!date || !rawProduct) { skipped++; continue; }

        const amount = parseFloat(rawAmount.replace(/[^0-9.\-]/g, "")) || 0;

        const fingerprint = `${date}|${rawProduct.toLowerCase()}|${amount}`;
        if (existingKeys.has(fingerprint)) { skipped++; continue; }

        const productId = await getOrCreateProduct(rawProduct);
        if (!productId) { skipped++; continue; }

        existingKeys.add(fingerprint);

        toInsert.push({
          user_id: user.id,
          product_id: productId,
          date,
          revenue_original: amount,
          revenue_usd: amount,
          currency_code: "USD",
          ad_spend_original: 0,
          ad_spend_usd: 0,
          variable_cost_original: 0,
          variable_cost_usd: 0,
          profit_usd: amount,
          country: selectedCountry,
          notes: [rawProduct, rawStatus].filter(Boolean).join(" — ") || null,
          source: "google_sheets",
        });
      }

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("daily_records")
          .insert(toInsert);
        if (insertError) throw new Error(insertError.message);
      }

      const result: SyncResult = { inserted: toInsert.length, skipped };
      setLastResult(result);
      setStatus("success");
      return result;
    } catch (err: any) {
      const result: SyncResult = { inserted: 0, skipped: 0, error: err.message ?? "Error desconocido" };
      setLastResult(result);
      setStatus("error");
      return result;
    }
  }, [selectedCountry]);

  return { sync, status, lastResult };
}
