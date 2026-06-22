import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User as UserIcon, ScanText, UserPlus } from "lucide-react";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/extract": "New Extraction",
  "/history": "History",
  "/profile": "Profile",
};

export function Header() {
  const { user, logout, isGuest } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titles[pathname] ?? "";

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <header className="h-16 border-b border-border bg-background/70 backdrop-blur-xl sticky top-0 z-30">
      <div className="h-full px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="md:hidden grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent-foreground text-primary-foreground shadow-glow">
            <ScanText className="h-5 w-5" />
          </div>
          <h1 className="truncate text-base md:text-lg font-semibold tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {isGuest && (
            <Button asChild size="sm" className="shadow-glow hidden sm:inline-flex">
              <Link to="/register">
                <UserPlus className="h-4 w-4" /> Create account
              </Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 rounded-full p-1 pr-3 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent-foreground text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">
                {isGuest ? "Guest" : user?.fullName}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="font-semibold">{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isGuest ? (
                <DropdownMenuItem asChild>
                  <Link to="/register" className="cursor-pointer">
                    <UserPlus className="h-4 w-4 mr-2" /> Create account
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <UserIcon className="h-4 w-4 mr-2" /> Profile
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> {isGuest ? "Exit guest mode" : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
