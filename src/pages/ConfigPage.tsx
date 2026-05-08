// ============================================================
// Configuration Page — Google Sheets sync URL + ROAS thresholds
// ============================================================

import { useState, useEffect } from "react";
import { Save, Link2, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function ConfigPage() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [form, setForm] = useState({ ...state.config });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Google Sheet URL
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetSaving, setSheetSaving] = useState(false);
  const [sheetSaved, setSheetSaved] = useState(false);
  const [sheetError, setSheetError] = useState("");

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

  async function handleSaveSheetUrl() {
    if (!user) return;
    setSheetSaving(true);
    setSheetError("");

    if (sheetUrl && !sheetUrl.includes("docs.google.com/spreadsheets")) {
      setSheetError("La URL no parece ser de Google Sheets. Asegúrate de pegar la URL completa.");
      setSheetSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ google_sheet_url: sheetUrl || null })
      .eq("id", user.id);

    setSheetSaving(false);
    if (error) {
      setSheetError("Error al guardar: " + error.message);
    } else {
      setSheetSaved(true);
      setTimeout(() => setSheetSaved(false), 2000);
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    dispatch({ type: "UPDATE_CONFIG", config: form });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="section-heading">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Parámetros globales de la plataforma</p>
      </div>

      {/* ── Google Sheets Sync ────────────────────────── */}
      <Section title="🔗 Sincronización Google Sheets">
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Pega la URL de tu Google Sheet <strong className="text-foreground">compartido públicamente</strong>.
            La app leerá automáticamente las filas nuevas cada vez que entres al Dashboard.
          </p>

          <div className="grid grid-cols-5 gap-1.5 text-[10px]">
            {[
              { col: "A", label: "Fecha" },
              { col: "B", label: "Producto" },
              { col: "C", label: "Monto (USD)" },
              { col: "D", label: "Estado" },
            ].map(({ col, label }) => (
              <div key={col} className="bg-background border border-border rounded-md px-2 py-1.5 text-center">
                <span className="block text-primary font-bold">{col}</span>
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={sheetUrl}
              onChange={e => { setSheetUrl(e.target.value); setSheetError(""); }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="form-input flex-1 text-sm"
            />
            <button
              type="button"
              onClick={handleSaveSheetUrl}
              disabled={sheetSaving}
              className="flex items-center gap-1.5 h-10 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0"
            >
              {sheetSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : sheetSaved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              {sheetSaved ? "Guardado" : "Guardar URL"}
            </button>
          </div>

          {sheetError && (
            <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {sheetError}
            </div>
          )}

          {sheetUrl && !sheetError && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Hoja configurada · La sincronización se activa al entrar al Dashboard</span>
              <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-primary hover:underline ml-auto shrink-0">
                Abrir <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

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
      </Section>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Reporting currency ────────────────────────── */}
        <Section title="Moneda de Reporte">
          <p className="text-muted-foreground text-xs mb-3">
            Todos los valores se ingresan y muestran en <span className="text-foreground font-semibold">USD ($)</span>.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label-caps">Moneda</label>
              <input value="USD" readOnly className="form-input w-full opacity-50 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="label-caps">Símbolo</label>
              <input value="$" readOnly className="form-input w-full opacity-50 cursor-not-allowed" />
            </div>
          </div>
        </Section>

        {/* ── ROAS thresholds ───────────────────────────── */}
        <Section title="Umbrales ROAS">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label-caps">ROAS objetivo</label>
              <input type="number" step="0.1" min={0} value={form.roasObjective}
                onChange={(e) => setForm({ ...form, roasObjective: parseFloat(e.target.value) })}
                className="form-input w-full" />
              <p className="text-muted-foreground/60 text-[11px]">Meta de eficiencia publicitaria</p>
            </div>
            <div className="space-y-1.5">
              <label className="label-caps">ROAS mínimo</label>
              <input type="number" step="0.1" min={0} value={form.roasMinimum}
                onChange={(e) => setForm({ ...form, roasMinimum: parseFloat(e.target.value) })}
                className="form-input w-full" />
              <p className="text-muted-foreground/60 text-[11px]">Umbral de alerta mínima</p>
            </div>
          </div>
        </Section>

        {/* ── Profit ────────────────────────────────────── */}
        <Section title="Utilidad">
          <div className="space-y-1.5">
            <label className="label-caps">Umbral de utilidad positiva (USD)</label>
            <input type="number" min={0} value={form.profitThreshold}
              onChange={(e) => setForm({ ...form, profitThreshold: parseFloat(e.target.value) })}
              className="form-input w-full" placeholder="0" />
            <p className="text-muted-foreground/60 text-[11px]">Utilidad mínima (en USD) para considerar un día rentable</p>
          </div>
        </Section>

        {/* ── ROAS color legend ─────────────────────────── */}
        <Section title="Referencia de Colores ROAS">
          <div className="space-y-2 text-sm">
            {[
              { range: "ROAS < 1.0",      label: "Crítico",    cls: "bg-status-red"    },
              { range: "ROAS 1.0 – 1.29", label: "Alerta",     cls: "bg-status-orange" },
              { range: "ROAS 1.3 – 1.49", label: "Precaución", cls: "bg-status-yellow" },
              { range: "ROAS ≥ 1.5",      label: "Excelente",  cls: "bg-status-green"  },
            ].map((row) => (
              <div key={row.range} className="flex items-center justify-between">
                <span className="text-muted-foreground">{row.range}</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${row.cls}`}>{row.label}</span>
              </div>
            ))}
          </div>
        </Section>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 h-10 px-6 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar Configuración"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl card-glow p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-3">{title}</h3>
      {children}
    </div>
  );
}
