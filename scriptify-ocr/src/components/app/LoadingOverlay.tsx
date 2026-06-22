import { Loader2 } from "lucide-react";

export function LoadingOverlay({ message = "Processing..." }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-background/70 backdrop-blur-sm rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
