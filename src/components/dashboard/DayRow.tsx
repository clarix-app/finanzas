// ============================================================
// Day Row – clickable inline editor for daily records
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Trash2, Check, X, Loader2 } from "lucide-react";
import type { DaySummary } from "@/types";
import { formatMonto, getCurrencyLabel, formatRoas } from "@/lib/calculations";
import { Input } from "@/components/ui/input";

function roasColor(roas: number, hasAds: boolean): string {
  if (!hasAds) return "text-muted-foreground";
  if (roas >= 3) return "text-green-400";
  if (roas >= 2) return "text-blue-400";
  if (roas >= 1) return "text-yellow-400";
  return "text-red-400";
}

function statusBadge(roas: number, hasAds: boolean): { label: string; cls: string } {
  if (!hasAds) return { label: "Sin ads", cls: "bg-muted text-muted-foreground" };
  if (roas >= 3) return { label: "Excelente", cls: "bg-green-500/20 text-green-400" };
  if (roas >= 2) return { label: "Bueno", cls: "bg-blue-500/20 text-blue-400" };
  if (roas >= 1) return { label: "Alerta", cls: "bg-yellow-500/20 text-yellow-400" };
  return { label: "Crítico", cls: "bg-red-500/20 text-red-400" };
}

interface DayRowProps {
  day: DaySummary;
  index: number;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Record<string, any>) => Promise<{ error: any }>;
  onAdd: (record: any) => Promise<{ data: any; error: any }>;
  country: string;
}

export default function DayRow({ day, index, onDelete, onUpdate, onAdd, country }: DayRowProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const hasData = day.records.length > 0;
  const rec = hasData ? day.records[0] : null;

  const [editFact, setEditFact] = useState("");
  const [editAds, setEditAds] = useState("");
  const [editCostos, setEditCostos] = useState("");
  const [editNotas, setEditNotas] = useState("");

  const isCL = country === "CL";
  const curLabel = getCurrencyLabel(country);

  // Day-level aggregates
  const dayFact = day.totalRevenue;
  const dayAds = day.totalInvestment;
  const dayProfit = dayFact - dayAds;
  const dayHasAds = dayAds > 0;
  const dayRoas = dayHasAds ? dayFact / dayAds : 0;
  const badge = statusBadge(dayRoas, dayHasAds);

  function openEditor() {
    if (hasData && rec) {
      if (isCL) {
        setEditFact(String(Math.round(rec.revenueUsd / 1000)));
        setEditAds(String(Math.round(rec.investmentUsd / 1000)));
        setEditCostos(String(Math.round((rec.variableCostsUsd ?? 0) / 1000)));
      } else {
        setEditFact(String(rec.revenueUsd));
        setEditAds(String(rec.investmentUsd));
        setEditCostos(String(rec.variableCostsUsd ?? 0));
      }
      setEditNotas(rec.notes ?? "");
    } else {
      setEditFact("");
      setEditAds("");
      setEditCostos("");
      setEditNotas("");
    }
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const factInput = parseFloat(editFact) || 0;
    const adsInput = parseFloat(editAds) || 0;
    const costosInput = parseFloat(editCostos) || 0;

    // CL: user enters in K CLP → multiply by 1000 for storage
    // Others: user enters in USD → store directly
    const factReal = isCL ? factInput * 1000 : factInput;
    const adsReal = isCL ? adsInput * 1000 : adsInput;
    const costosReal = isCL ? costosInput * 1000 : costosInput;

    const payload = {
      revenue_usd: factReal,
      revenue_original: factReal,
      ad_spend_usd: adsReal,
      ad_spend_original: adsReal,
      variable_cost_usd: costosReal,
      variable_cost_original: costosReal,
      notes: editNotas || null,
    };

    if (hasData && rec) {
      await onUpdate(rec.id, payload);
    } else {
      await onAdd({
        ...payload,
        date: day.date,
        country,
        currency_code: isCL ? "CLP" : "USD",
      });
    }

    setSaving(false);
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function handleDelete(id: string) {
    await onDelete(id);
    setConfirmDeleteId(null);
    setEditing(false);
  }

  // Preview calculations in the editor
  const previewFact = parseFloat(editFact) || 0;
  const previewAds = parseFloat(editAds) || 0;
  const previewProfit = previewFact - previewAds;
  const previewRoas = previewAds > 0 ? previewFact / previewAds : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, type: "spring", stiffness: 300, damping: 35 }}
      className={`rounded-lg overflow-hidden border border-border/50 ${!hasData && !editing ? "opacity-40" : ""}`}
    >
      {/* Collapsed row */}
      <button
        onClick={openEditor}
        className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 text-left hover:bg-white/[0.03] cursor-pointer"
      >
        <motion.div
          animate={{ rotate: editing ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="flex-shrink-0"
        >
          <ChevronRight className={`w-4 h-4 ${!hasData ? "text-muted-foreground/30" : "text-muted-foreground"}`} />
        </motion.div>

        <span className="text-foreground font-semibold tabular w-14 flex-shrink-0 text-sm">
          Día {day.dayNumber}
        </span>

        {!hasData && !editing ? (
          <span className="text-muted-foreground/40 text-xs">Sin datos — clic para agregar</span>
        ) : hasData ? (
          <div className="flex-1 flex items-center gap-4 overflow-x-auto">
            <DataCell label={`Ads (${curLabel})`} value={formatMonto(dayAds, country)} />
            <DataCell label={`Fact (${curLabel})`} value={formatMonto(dayFact, country)} />
            <DataCell
              label={`Profit (${curLabel})`}
              value={formatMonto(dayProfit, country)}
              valueClass={dayProfit > 0 ? "text-green-400" : dayProfit < 0 ? "text-red-400" : "text-foreground"}
            />
            <DataCell
              label="ROAS"
              value={dayHasAds ? dayRoas.toFixed(2) + "x" : "—"}
              valueClass={roasColor(dayRoas, dayHasAds)}
            />
            <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
          </div>
        ) : null}
      </button>

      {/* Inline editor */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="p-4 space-y-3 bg-muted/5">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="label-caps text-[10px]">Fact ({curLabel})</label>
                  <Input
                    type="number"
                    step={isCL ? "1" : "0.01"}
                    placeholder={isCL ? "ej. 350" : "ej. 580.00"}
                    value={editFact}
                    onChange={(e) => setEditFact(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="label-caps text-[10px]">Ads ({curLabel})</label>
                  <Input
                    type="number"
                    step={isCL ? "1" : "0.01"}
                    placeholder={isCL ? "ej. 144" : "ej. 150.00"}
                    value={editAds}
                    onChange={(e) => setEditAds(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="label-caps text-[10px]">Costos ({curLabel})</label>
                  <Input
                    type="number"
                    step={isCL ? "1" : "0.01"}
                    placeholder={isCL ? "ej. 20" : "ej. 50.00"}
                    value={editCostos}
                    onChange={(e) => setEditCostos(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="label-caps text-[10px]">Notas</label>
                <Input
                  type="text"
                  placeholder="Observaciones del día..."
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Preview */}
              {(editFact || editAds) && (
                <div className="flex gap-4 text-[11px] text-muted-foreground">
                  <span>Profit ({curLabel}): <strong className={`${previewProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {isCL ? Math.round(previewProfit) : previewProfit.toFixed(2)}
                  </strong></span>
                  <span>ROAS: <strong className="text-foreground">
                    {previewAds > 0 ? previewRoas.toFixed(2) + "x" : "—"}
                  </strong></span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-[11px] font-semibold hover:bg-muted/80 transition-colors"
                >
                  <X className="w-3 h-3" /> Cancelar
                </button>

                {hasData && rec && (
                  <>
                    {confirmDeleteId === rec.id ? (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-semibold hover:bg-destructive/90 transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground text-[11px] font-semibold hover:bg-muted/80 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(rec.id)}
                        className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[11px] font-semibold transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DataCell({ label, value, valueClass = "text-foreground" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span className="text-muted-foreground/60 text-[10px] uppercase tracking-wide">{label}:</span>
      <span className={`font-semibold text-xs tabular ${valueClass}`}>{value}</span>
    </div>
  );
}
