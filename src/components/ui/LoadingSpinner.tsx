import { Loader2 } from "lucide-react";

export function LoadingSpinner({ message = "Cargando datos..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
      <span className="text-muted-foreground text-sm">{message}</span>
    </div>
  );
}
