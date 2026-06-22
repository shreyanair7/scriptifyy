import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FilePlus2, History, User, LogOut, ScanText, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, guest: false },
  { to: "/extract", label: "New Extraction", icon: FilePlus2, guest: true },
  { to: "/history", label: "History", icon: History, guest: false },
  { to: "/profile", label: "Profile", icon: User, guest: false },
] as const;

export function Sidebar() {
  const { logout, isGuest } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent-foreground text-primary-foreground shadow-glow">
          <ScanText className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">Scriptify</span>
          <span className="text-[11px] text-muted-foreground">Intelligent OCR</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          const locked = isGuest && !item.guest;
          const Content = (
            <>
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {locked && <Lock className="h-3 w-3 opacity-60" />}
            </>
          );
          const cls = cn(
            "group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            locked && "opacity-60 cursor-not-allowed hover:bg-transparent hover:text-sidebar-foreground/70",
          );
          if (locked) {
            return (
              <div key={item.to} className={cls} title="Sign in to access">
                {Content}
              </div>
            );
          }
          return (
            <Link key={item.to} to={item.to} className={cls}>
              {Content}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {isGuest ? "Exit guest mode" : "Logout"}
        </button>
      </div>
    </aside>
  );
}
