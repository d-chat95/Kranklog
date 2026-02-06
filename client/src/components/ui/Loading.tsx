import { Loader2 } from "lucide-react";

export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground font-display text-lg uppercase tracking-wider animate-pulse">{text}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <LoadingSpinner text="Initializing System" />
    </div>
  );
}
