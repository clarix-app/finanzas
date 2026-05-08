import { useApp } from "@/context/AppContext";
import { MONTHS_ES } from "@/lib/calculations";
import { User, ChevronDown } from "lucide-react";

const YEARS = [2025, 2026, 2027];
const COUNTRIES = [
  { code: "CL", name: "Chile" },
  { code: "VE", name: "Venezuela" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
  { code: "EC", name: "Ecuador" },
  { code: "PY", name: "Paraguay" },
];

export default function AppHeader() {
  const { state, dispatch } = useApp();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-foreground font-semibold text-sm">
          {state.selectedYear}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={state.selectedYear}
            onChange={(e) => dispatch({ type: "SET_YEAR", year: parseInt(e.target.value) })}
            className="appearance-none bg-secondary border border-border text-foreground text-sm px-3 py-1.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={state.selectedCountry}
            onChange={(e) => {
              const country = e.target.value;
              dispatch({ type: "SET_COUNTRY", country });
              localStorage.setItem("selectedCountry", country);
            }}
            className="appearance-none bg-secondary border border-border text-foreground text-sm px-3 py-1.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={state.selectedMonth}
            onChange={(e) => dispatch({ type: "SET_MONTH", month: parseInt(e.target.value) })}
            className="appearance-none bg-secondary border border-border text-foreground text-sm px-3 py-1.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {MONTHS_ES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>

        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-semibold px-2.5 py-1 rounded-full border border-primary/20 tracking-wider uppercase">
          MVP v1.0
        </span>

        <button className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-colors">
          <User className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
