import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/app/StatsCard";
import { useAuth } from "@/contexts/AuthContext";
import { ocrService } from "@/services/ocrService";
import { FileText, CheckCircle2, Clock, FilePlus2, ArrowRight, ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Scriptify" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  if (isGuest) return <Navigate to="/extract" replace />;
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs", user?.id],
    queryFn: () => ocrService.list(user!.id),
    enabled: !!user,
  });

  const total = jobs.length;
  const successful = jobs.filter((j) => j.status === "success").length;
  const last = jobs[0]?.createdAt;

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.fullName.split(" ")[0]}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's an overview of your text extraction activity.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/extract" })} size="lg" className="shadow-glow">
          <FilePlus2 className="h-4 w-4 mr-2" /> New Extraction
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Total files processed" value={total} icon={FileText} />
        <StatsCard label="Successful extractions" value={successful} icon={CheckCircle2} hint={total ? `${Math.round((successful / total) * 100)}% success rate` : undefined} />
        <StatsCard
          label="Last extraction"
          value={last ? formatDistanceToNow(new Date(last), { addSuffix: true }) : "—"}
          icon={Clock}
        />
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Recent activity</h3>
            <Link to="/history" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <EmptyState onAction={() => navigate({ to: "/extract" })} />
          ) : (
            <ul className="divide-y divide-border">
              {jobs.slice(0, 5).map((j) => (
                <li key={j.id} className="py-3 flex items-center gap-4">
                  <img src={j.imageDataUrl} alt="" className="h-12 w-12 rounded-md object-cover border border-border bg-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{j.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(j.createdAt), { addSuffix: true })} • {j.extractedText.length} characters
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex text-xs font-medium px-2 py-1 rounded-full bg-success/10 text-success">
                    Success
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="text-center py-10">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">No extractions yet</p>
      <p className="text-xs text-muted-foreground">Upload your first image to get started.</p>
      <Button onClick={onAction} variant="outline" size="sm" className="mt-4">
        Start extracting
      </Button>
    </div>
  );
}
