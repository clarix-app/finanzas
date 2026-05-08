// ============================================================
// Import Page — Excel/CSV upload + Google Sheets sync (USD only)
// ============================================================

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, CheckCircle, FileSpreadsheet, Link2,
  RefreshCw, Loader2, CheckCircle2, ExternalLink, Upload, LayoutGrid, Landmark,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { computeRecord } from "@/lib/calculations";
import type { DailyRecord } from "@/types";

import ImportadorBancoEstado from "@/components/ImportadorBancoEstado";
import { useGoogleSheetSync } from "@/hooks/useGoogleSheetSync";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface PreviewRow {
  date: string;
  product: string;
  investment: number;
  revenue: number;
  variableCosts: number;
  platform: string;
  account: string;
  notes: string;
  valid: boolean;
  error?: string;
}

type Tab = "excel" | "sheets" | "bancoestado";

const REQUIRED_COLUMNS = ["Fecha", "Producto", "Gasto Ads", "Facturación"];
const OPTIONAL_COLUMNS = ["Costos Variables", "Plataforma", "Cuenta Ads", "Notas"];

export default function ImportPage() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("excel");

  const [preview, setPreview]       = useState<PreviewRow[] | null>(null);
  const [fileName, setFileName]     = useState("");
  const [missingCols, setMissingCols] = useState<string[]>([]);
  const [importing, setImporting]   = useState(false);
  const [imported, setImported]     = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);

  const [sheetUrl, setSheetUrl]           = useState("");
  const [urlSaving, setUrlSaving]         = useState(false);
  const [urlSaved, setUrlSaved]           = useState(false);
  const [urlError, setUrlError]           = useState("");
  const { sync, status: syncStatus, lastResult } = useGoogleSheetSync(state.selectedCountry);

  // BancoEstado state

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("google_sheet_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.google_sheet_url) setSheetUrl(data.google_sheet_url);
      });
  }, [user]);

  function handleFileSelect(file: File) {
    parseFile(file);
  }

  function parseFile(file: File) {
    setImported(false);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (rows.length === 0) return;

        const headers = Object.keys(rows[0] as object);
        const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
        setMissingCols(missing);
        if (missing.length > 0) { setPreview(null); return; }

        const parsed: PreviewRow[] = rows.map((row) => {
          const date          = String(row["Fecha"] || "").trim();
          const product       = String(row["Producto"] || "").trim();
          const investment    = parseFloat(String(row["Gasto Ads"] || "0")) || 0;
          const revenue       = parseFloat(String(row["Facturación"] || "0")) || 0;
          const variableCosts = parseFloat(String(row["Costos Variables"] || "0")) || 0;
          const platform      = String(row["Plataforma"] || "").trim();
          const account       = String(row["Cuenta Ads"] || "").trim();
          const notes         = String(row["Notas"] || "").trim();

          let valid = true; let error = "";
          if (!date)          { valid = false; error = "Fecha faltante"; }
          else if (!product)  { valid = false; error = "Producto faltante"; }
          else if (investment <= 0) { valid = false; error = "Inversión inválida"; }

          return { date, product, investment, revenue, variableCosts, platform, account, notes, valid, error };
        });
        setPreview(parsed);
      } catch (err) {
        console.error(err);
        setMissingCols(["Error al leer el archivo"]);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleImport() {
    if (!preview) return;
    setImporting(true);
    const validRows = preview.filter((r) => r.valid);
    const records: DailyRecord[] = validRows.map((row) => {
      const product = state.products.find((p) => p.name.toLowerCase() === row.product.toLowerCase());
      return computeRecord({
        id: `import-${row.date}-${row.product}-${Date.now()}`,
        date: row.date,
        productId: product?.id || `prod-import-${row.product}`,
        productName: row.product,
        currencyCode: "USD",
        investment: row.investment,
        revenue: row.revenue,
        variableCosts: row.variableCosts,
        platform: row.platform || undefined,
        accountId: row.account || undefined,
        notes: row.notes || "",
      }, []);
    });
    dispatch({ type: "IMPORT_RECORDS", records });
    setImporting(false);
    setImported(true);
    setPreview(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  async function handleSaveSheetUrl() {
    if (!user) return;
    if (sheetUrl && !sheetUrl.includes("docs.google.com/spreadsheets")) {
      setUrlError("La URL no parece ser de Google Sheets. Asegúrate de pegar la URL completa.");
      return;
    }
    setUrlSaving(true);
    setUrlError("");
    const { error } = await supabase
      .from("profiles")
      .update({ google_sheet_url: sheetUrl || null })
      .eq("id", user.id);
    setUrlSaving(false);
    if (error) {
      setUrlError("Error al guardar: " + error.message);
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } else {
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 2500);
      toast({
        title: sheetUrl ? "URL guardada ✓" : "URL eliminada",
        description: sheetUrl
          ? "La URL de tu Google Sheet fue guardada en tu perfil."
          : "La URL fue eliminada de tu perfil.",
      });
    }
  }

  async function handleSync() {
    if (!sheetUrl) return;
    await sync(sheetUrl);
  }


  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="section-heading">Importar Datos</h1>
        <p className="text-muted-foreground text-sm mt-1">Carga masiva desde Excel / CSV o desde Google Sheets · Valores en USD</p>
      </div>

      <div className="flex gap-1 bg-background border border-border rounded-lg p-1 w-fit">
        {([
          { key: "excel" as Tab, icon: Upload, label: "Excel / CSV" },
          { key: "sheets" as Tab, icon: LayoutGrid, label: "Google Sheets" },
          { key: "bancoestado" as Tab, icon: Landmark, label: "BancoEstado" },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "excel" && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl card-glow p-5">
            <p className="label-caps mb-3">Formato esperado (todos los valores en USD)</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-foreground font-semibold mb-2">Columnas requeridas</p>
                <ul className="space-y-1">
                  {REQUIRED_COLUMNS.map((col) => (
                    <li key={col} className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-success text-xs">✓</span>{col}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-foreground font-semibold mb-2">Columnas opcionales</p>
                <ul className="space-y-1">
                  {OPTIONAL_COLUMNS.map((col) => (
                    <li key={col} className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-muted-foreground/40 text-xs">○</span>{col}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40">
              <p className="text-muted-foreground text-xs">
                La columna "Fecha" debe estar en formato YYYY-MM-DD (ej. 2026-02-15). Todos los montos en USD.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl card-glow p-5">
            <p className="label-caps mb-3">Ejemplo de filas</p>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Fecha", "Producto", "Gasto Ads", "Facturación"].map(h => (
                      <th key={h} className="label-caps text-left px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["2026-02-01", "PACL BASE", "150.00", "580.00"],
                    ["2026-02-01", "Megapack Crochetero", "200.00", "420.00"],
                    ["2026-02-01", "FRYERBOOK", "80.00", "160.00"],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 tabular text-muted-foreground">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold mb-1">Arrastra tu archivo aquí</p>
            <p className="text-muted-foreground text-sm">o haz clic para seleccionar</p>
            <p className="text-muted-foreground/60 text-xs mt-2">Excel (.xlsx) o CSV (.csv)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>

          {missingCols.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-destructive font-semibold text-sm">Columnas faltantes</p>
                <p className="text-destructive/80 text-xs mt-1">{missingCols.join(", ")}</p>
              </div>
            </div>
          )}

          {imported && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <p className="text-success font-semibold text-sm">Datos importados correctamente.</p>
            </div>
          )}

          {preview && (
            <div className="bg-card rounded-xl card-glow overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Vista previa — {fileName}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {preview.filter((r) => r.valid).length} válidos / {preview.filter((r) => !r.valid).length} con errores
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPreview(null); setFileName(""); }}
                    className="px-4 h-9 rounded-lg border border-border text-sm hover:bg-accent transition-colors text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || preview.filter((r) => r.valid).length === 0}
                    className="px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {importing ? "Importando..." : `Confirmar (${preview.filter((r) => r.valid).length} registros)`}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      {["Estado", "Fecha", "Producto", "Inversión", "Facturación", "Costos", "Plataforma"].map((h) => (
                        <th key={h} className="label-caps text-left px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className={`table-row-hover border-b border-border/30 last:border-0 ${!row.valid ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3">
                          {row.valid
                            ? <span className="bg-success/10 text-success text-[10px] font-semibold px-2 py-0.5 rounded-full">OK</span>
                            : <span className="bg-destructive/10 text-destructive text-[10px] font-semibold px-2 py-0.5 rounded-full" title={row.error}>Error</span>
                          }
                        </td>
                        <td className="px-4 py-3 tabular text-muted-foreground">{row.date}</td>
                        <td className="px-4 py-3 text-foreground">{row.product}</td>
                        <td className="px-4 py-3 tabular text-muted-foreground">{formatUSD(row.investment)}</td>
                        <td className="px-4 py-3 tabular text-foreground">{formatUSD(row.revenue)}</td>
                        <td className="px-4 py-3 tabular text-muted-foreground">{formatUSD(row.variableCosts)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.platform || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "sheets" && (
        <div className="space-y-5">
          <div className="bg-card rounded-xl card-glow p-5 space-y-4">
            <p className="label-caps">Columnas esperadas en el Sheet</p>
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              {[
                { col: "A", label: "Fecha" },
                { col: "B", label: "Producto" },
                { col: "C", label: "Monto (USD)" },
                { col: "D", label: "Estado" },
              ].map(({ col, label }) => (
                <div key={col} className="bg-background border border-border rounded-lg px-2 py-2 text-center">
                  <span className="block text-primary font-bold text-sm">{col}</span>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <div className="bg-background border border-border/60 rounded-lg px-3 py-2.5 space-y-1">
              <p className="text-[11px] font-semibold text-foreground/70">Cómo compartir tu Google Sheet</p>
              <ol className="text-[11px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                <li>Abre tu hoja en Google Sheets</li>
                <li>Haz clic en <em>Compartir</em> → <em>Cambiar a cualquier persona con el enlace</em></li>
                <li>Asegúrate de que el rol sea <strong className="text-foreground/70">Lector</strong></li>
                <li>Copia y pega la URL aquí</li>
              </ol>
            </div>
          </div>

          <div className="bg-card rounded-xl card-glow p-5 space-y-4">
            <p className="label-caps">URL de tu Google Sheet</p>

            <div className="flex gap-2">
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => { setSheetUrl(e.target.value); setUrlError(""); }}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="form-input flex-1 text-sm"
              />
              <button
                type="button"
                onClick={handleSaveSheetUrl}
                disabled={urlSaving}
                className="flex items-center gap-1.5 h-10 px-3 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50 shrink-0"
                title="Guardar URL en tu perfil"
              >
                {urlSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : urlSaved ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{urlSaved ? "Guardado" : "Guardar"}</span>
              </button>
            </div>

            {urlError && (
              <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {urlError}
              </div>
            )}

            {sheetUrl && !urlError && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                <span>Hoja configurada · Se sincroniza automáticamente al entrar al Dashboard</span>
                <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-0.5 text-primary hover:underline ml-auto shrink-0">
                  Abrir <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <button
              onClick={handleSync}
              disabled={!sheetUrl || syncStatus === "syncing"}
              className="flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 w-full justify-center"
            >
              {syncStatus === "syncing" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {syncStatus === "syncing" ? "Sincronizando..." : "Sincronizar ahora"}
            </button>

            <AnimatePresence>
              {syncStatus === "success" && lastResult && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg px-4 py-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <div className="text-sm">
                    <span className="text-success font-semibold">Sincronización exitosa — </span>
                    <span className="text-muted-foreground">
                      {lastResult.inserted} registro{lastResult.inserted !== 1 ? "s" : ""} nuevos
                      {lastResult.skipped > 0 && ` · ${lastResult.skipped} omitidos (duplicados)`}
                    </span>
                  </div>
                </motion.div>
              )}
              {syncStatus === "error" && lastResult?.error && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3"
                >
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="text-destructive font-semibold">Error al sincronizar — </span>
                    <span className="text-muted-foreground">{lastResult.error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {activeTab === "bancoestado" && <ImportadorBancoEstado />}

    </div>
  );
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
}
