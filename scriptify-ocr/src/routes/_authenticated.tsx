import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/app/Sidebar";
import { Header } from "@/components/app/Header";
import { GuestBanner } from "@/components/app/GuestBanner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading, isGuest } = useAuth();
  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {isGuest && <GuestBanner />}
        <Header />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
