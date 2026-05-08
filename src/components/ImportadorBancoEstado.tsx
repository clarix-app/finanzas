import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Landmark, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DaySummary { date: string; count: number; total: number; }
interface ParsedFile { fileName: string; byDay: Record<string, DaySummary>; }

export default function ImportadorBancoEstado() {
  const { user } = useAuth();

  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [dragging, setDragging] = useState(false);
  
  const [adsUSD, setAdsUSD] = useState(0);
  const [producto, setProducto] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(() => localStorage.getItem('selectedCountry') ?? 'CL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = wb.SheetNames.includes("Transferencias") ? "Transferencias" : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const byDay: Record<string, DaySummary> = {};
        rows.forEach((row) => {
          const monto = parseFloat(String(row["Monto"] ?? row["monto"] ?? 0));
          if (!monto || monto <= 0) return;
          const rawDate = row["Fecha - Hora"] ?? row["Fecha"] ?? row["fecha"];
          let dateStr = "desconocido";
          if (rawDate instanceof Date) {
            dateStr = rawDate.toISOString().split("T")[0];
          } else if (typeof rawDate === "string" && rawDate.trim()) {
            const part = rawDate.trim().split(" ")[0];
            const sep = part.includes("/") ? "/" : "-";
            const [d, m, y] = part.split(sep);
            if (d && m && y) dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
          if (!byDay[dateStr]) byDay[dateStr] = { date: dateStr, count: 0, total: 0 };
          byDay[dateStr].count += 1;
          byDay[dateStr].total += monto;
        });
        if (Object.keys(byDay).length === 0) throw new Error("No se encontraron transferencias válidas");
        setParsed({ fileName: file.name, byDay });
        setResult(null);
      } catch (err: unknown) {
        toast({ title: "Error leyendo archivo", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleImport = async () => {
    if (!parsed) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    console.log('[BancoEstado] user_id:', authUser?.id);

    if (!authUser) {
      setResult({ ok: false, msg: "No hay sesión activa. Inicia sesión nuevamente." });
      return;
    }

    setLoading(true);
    setResult(null);
    const prodName = producto.trim() || "Transferencias BancoEstado";
    let inserted = 0;
    const errors: string[] = [];

    let productId: string | null = null;
    const { data: existingProd, error: prodFindErr } = await supabase
      .from("products").select("id").eq("user_id", authUser.id).ilike("name", prodName).maybeSingle();
    if (prodFindErr) console.error('[BancoEstado] Error buscando producto:', prodFindErr.message);
    if (existingProd) {
      productId = existingProd.id;
    } else {
      const { data: newProd, error: prodErr } = await supabase
        .from("products").insert({ user_id: authUser.id, name: prodName, active: true }).select("id").single();
      if (prodErr) {
        console.error('[BancoEstado] Error creando producto:', prodErr.message, prodErr);
        setResult({ ok: false, msg: "Error creando producto: " + prodErr.message });
        setLoading(false);
        return;
      }
      productId = newProd.id;
    }

    for (const day of Object.values(parsed.byDay)) {
      const revUSD = day.total;
      const payload = {
        user_id: authUser.id,
        product_id: productId,
        date: day.date,
        revenue_usd: revUSD,
        revenue_original: revUSD,
        ad_spend_usd: 0,
        ad_spend_original: 0,
        variable_cost_usd: 0,
        variable_cost_original: 0,
        units_sold: day.count,
        country: selectedCountry,
        notes: `Importado BancoEstado — ${prodName}`,
      };
      const { error } = await supabase.from("daily_records").insert(payload);
      if (error) {
        console.error('[BancoEstado] Error insert', day.date, error.message, error);
        errors.push(`${day.date}: ${error.message}`);
      } else {
        inserted++;
      }
    }

    setLoading(false);
    if (errors.length === 0) {
      setResult({ ok: true, msg: `${inserted} día(s) importado(s) correctamente.` });
    } else {
      setResult({ ok: false, msg: `${inserted} importado(s). Errores: ${errors.join(" | ")}` });
    }

    setLoading(false);
    if (errors.length === 0) {
      setResult({ ok: true, msg: `${inserted} día(s) importado(s) correctamente.` });
    } else {
      setResult({ ok: false, msg: `${inserted} importado(s). Errores: ${errors.join(" | ")}` });
    }
  };

  const reset = () => { setParsed(null); setResult(null); setProducto(""); };
  const totalVentas = parsed ? Object.values(parsed.byDay).reduce((a, b) => a + b.count, 0) : 0;
  const totalCLP = parsed ? Object.values(parsed.byDay).reduce((a, b) => a + b.total, 0) : 0;
  const ticketProm = totalVentas > 0 ? Math.round(totalCLP / totalVentas) : 0;
  const fmtCLP = (n: number) => Math.round(n / 1000).toLocaleString("es-CL");
  const fmtDate = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-xl card-glow p-5">
        <p className="text-sm text-muted-foreground">
          Sube el reporte de transferencias recibidas de BancoEstado (.xlsx). La app detecta las columnas <strong className="text-foreground">Fecha - Hora</strong> y <strong className="text-foreground">Monto</strong>, agrupa por día e importa a Supabase.
        </p>
      </div>

      {!parsed && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold mb-1">Arrastra el archivo aquí o haz clic</p>
          <p className="text-muted-foreground text-sm">TefSimpleConsultaRecibidas_*.xlsx</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
        </div>
      )}

      {parsed && (
        <div className="bg-card rounded-xl card-glow overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{parsed.fileName}</p>
                <p className="text-xs text-muted-foreground">{Object.keys(parsed.byDay).length} día(s)</p>
              </div>
            </div>
            <button onClick={reset} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 p-5 border-b border-border">
            {[
              { label: "Ventas", value: totalVentas.toLocaleString("es-CL") },
              { label: "Total (K CLP)", value: fmtCLP(totalCLP) },
              { label: "Ticket prom. (K)", value: fmtCLP(ticketProm) },
            ].map((m) => (
              <div key={m.label} className="bg-background border border-border rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-foreground tabular">{m.value}</p>
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="p-5 border-b border-border">
            <p className="label-caps mb-3">Resumen por día</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(parsed.byDay).sort().map(([date, d]) => (
                <div key={date} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-accent/30">
                  <span className="text-muted-foreground tabular">{fmtDate(date)}</span>
                  <span className="text-muted-foreground">{d.count} ventas</span>
                  <span className="text-foreground font-medium tabular">{fmtCLP(d.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 border-b border-border space-y-4">
            <div>
              <label className="label-caps text-xs mb-1.5 block">Nombre del producto</label>
              <input value={producto} onChange={(e) => setProducto(e.target.value)}
                placeholder='Ej: Moldes PDF (vacío = "Transferencias BancoEstado")'
                className="form-input w-full text-sm" />
            </div>
            <div>
              <label className="label-caps text-xs mb-1.5 block">País</label>
              <select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); localStorage.setItem('selectedCountry', e.target.value); }}
                className="form-input w-full text-sm">
                <option value="CL">Chile</option>
                <option value="VE">Venezuela</option>
                <option value="MX">México</option>
                <option value="AR">Argentina</option>
                <option value="EC">Ecuador</option>
                <option value="PY">Paraguay</option>
              </select>
            </div>
            <div>
              <label className="label-caps text-xs mb-1.5 block">Gasto en ads (CLP)</label>
              <input type="number" value={adsUSD} onChange={(e) => setAdsUSD(Number(e.target.value))}
                placeholder="0" className="form-input w-full text-sm" />
              <p className="text-[11px] text-muted-foreground mt-1">Para calcular ROAS</p>
            </div>
          </div>

          <div className="p-5 border-b border-border">
            <p className="label-caps mb-2">Previsualización</p>
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">Facturación: <strong className="text-foreground">{fmtCLP(totalCLP)}</strong></span>
              <span className="text-muted-foreground">ROAS: <strong className="text-foreground">{adsUSD > 0 ? (totalCLP / adsUSD).toFixed(2) + "x" : "—"}</strong></span>
              <span className="text-muted-foreground">Utilidad: <strong className="text-foreground">{fmtCLP(totalCLP - adsUSD)}</strong></span>
            </div>
          </div>

          <div className="p-5 space-y-3">
            <button onClick={handleImport} disabled={loading || !user}
              className="flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 w-full justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading ? "Importando..." : "Importar a Supabase"}
            </button>
            {result && (
              <div className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${
                result.ok ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"
              }`}>
                {result.ok ? <CheckCircle className="w-4 h-4 text-success shrink-0" /> : <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
                <span className={result.ok ? "text-success" : "text-destructive"}>{result.msg}</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
