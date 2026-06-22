import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading, isGuest } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isGuest ? "/extract" : "/dashboard"} replace />;
}
