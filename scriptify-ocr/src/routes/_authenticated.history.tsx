import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { ocrService, type OCRJob } from "@/services/ocrService";
import { format } from "date-fns";
import { Search, MoreHorizontal, Eye, Download, Trash2, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { OCRResultCard } from "@/components/app/OCRResultCard";
import { GuestLocked } from "@/components/app/GuestLocked";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — Scriptify" }] }),
  component: HistoryPage,
});

const PAGE_SIZE = 8;

function HistoryPage() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<OCRJob | null>(null);

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs", user?.id],
    queryFn: () => ocrService.list(user!.id),
    enabled: !!user && !isGuest,
  });

  if (isGuest) {
    return (
      <GuestLocked
        feature="Extraction history"
        description="Guest mode extractions aren't saved. Create a free account to keep a searchable history of every job."
      />
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => j.fileName.toLowerCase().includes(q));
  }, [jobs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const del = useMutation({
    mutationFn: (id: string) => ocrService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Extraction deleted");
    },
  });

  const downloadTxt = (j: OCRJob) => {
    const blob = new Blob([j.extractedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${j.fileName.replace(/\.[^.]+$/, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Extraction history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and manage previous OCR jobs.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by file name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">No extractions yet</p>
              <p className="text-xs text-muted-foreground">Your extraction history will appear here.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File name</TableHead>
                      <TableHead>Upload date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Text length</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell className="font-medium max-w-[260px]">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={j.imageDataUrl} alt="" className="h-9 w-9 rounded object-cover border border-border shrink-0" />
                            <span className="truncate">{j.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(j.createdAt), "MMM d, yyyy • h:mm a")}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex text-xs font-medium px-2 py-1 rounded-full bg-success/10 text-success">
                            Success
                          </span>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{j.characterCount}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={async () => {
                                  const full = await ocrService.get(j.id);
                                  if (full) setViewing(full);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View result
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  const full = await ocrService.get(j.id);
                                  if (full) downloadTxt(full);
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" /> Download .txt
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => del.mutate(j.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
                <span>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2 text-foreground font-medium">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Extraction result</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {viewing && <OCRResultCard job={viewing} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
