import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";

export function GuestBanner() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="relative border-b border-border bg-gradient-to-r from-primary/15 via-accent/40 to-primary/15">
      <div className="px-4 md:px-8 py-2.5 flex items-center gap-3 text-sm">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary shrink-0">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <p className="flex-1 min-w-0 text-foreground/90">
          You're using <span className="font-semibold text-foreground">Scriptify in Guest Mode</span>.{" "}
          <span className="text-muted-foreground">Create an account to save your extraction history.</span>
        </p>
        <Link
          to="/register"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 transition-colors"
        >
          Create account
        </Link>
        <button
          onClick={() => setHidden(true)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/40 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
