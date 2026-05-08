// ============================================================
// Dashboard KPI Card – with USD tooltip for original value
// ============================================================

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  valueClass?: string;
  trend?: { label: string; positive: boolean } | null;
  index?: number;
  /** Optional tooltip shown on hover: original amount in source currency */
  originalValue?: string;
  /** Currency label badge (e.g. "K CLP") */
  currencyLabel?: string;
}

export default function KPICard({
  title, value, subtitle, icon: Icon, valueClass = "text-foreground", trend, index = 0, originalValue, currencyLabel,
}: KPICardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ scale: 1.015 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="card-glow relative bg-card rounded-xl p-6 overflow-hidden cursor-default"
    >
      {/* Subtle top-left gradient glow */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: "radial-gradient(circle at 15% 15%, hsla(250,80%,70%,0.06), transparent 60%)",
        }}
      />

      {/* Currency badge */}
      <div className="absolute top-4 left-4">
        <span className="text-[9px] font-bold tracking-widest text-muted-foreground/50 uppercase">{currencyLabel ?? "USD"}</span>
      </div>

      {/* Icon */}
      <div className="absolute top-4 right-4">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Label */}
      <p className="label-caps mb-3 mt-2">{title}</p>

      {/* Value */}
      <p className={`kpi-value ${valueClass} tabular`}>{value}</p>

      {/* Subtitle / trend */}
      {subtitle && (
        <p className="text-muted-foreground text-xs mt-2">{subtitle}</p>
      )}
      {trend && (
        <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
          <span>{trend.positive ? "↑" : "↓"}</span>
          <span>{trend.label}</span>
        </div>
      )}

      {/* Hover tooltip for original value */}
      {originalValue && hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 right-3 bg-muted border border-border rounded-lg px-2.5 py-1.5 text-xs z-10 shadow-elevated"
        >
          <p className="text-muted-foreground text-[10px] leading-none mb-0.5">Valor original</p>
          <p className="text-foreground font-semibold tabular">{originalValue}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
