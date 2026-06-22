import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadZone } from "@/components/app/UploadZone";
import { OCRResultCard } from "@/components/app/OCRResultCard";
import { LoadingOverlay } from "@/components/app/LoadingOverlay";
import { useAuth } from "@/contexts/AuthContext";
import { ocrService, type OCRJob } from "@/services/ocrService";
import { Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/extract")({
  head: () => ({ meta: [{ title: "New Extraction — Scriptify" }] }),
  component: ExtractPage,
});

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function ExtractPage() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OCRJob | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file || !user) throw new Error("No file");
      setProgress(5);
      return ocrService.extract({
        userId: user.id,
        file,
        imageDataUrl: dataUrl,
        persist: !isGuest,
        onProgress: setProgress,
      });
    },
    onSuccess: (job) => {
      setResult(job);
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success(isGuest ? "Text extracted — sign up to save it" : "Text extracted successfully");
    },
    onError: (err: any) => toast.error(err.message || "Extraction failed"),
    onSettled: () => setProgress(0),
  });

  const reset = () => {
    setFile(null);
    setDataUrl("");
    setResult(null);
    setProgress(0);
  };

  if (result) {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-4">
        <OCRResultCard job={result} onNew={reset} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Extract text from an image</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop in a photo, scan, or handwritten note. We'll do the rest.
        </p>
      </div>

      {!file ? (
        <UploadZone
          onFile={(f, url) => {
            setFile(f);
            setDataUrl(url);
          }}
        />
      ) : (
        <Card className="relative shadow-soft overflow-hidden">
          {mutation.isPending && <LoadingOverlay message="Extracting text..." />}
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="sm:w-56 shrink-0">
                <div className="rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={dataUrl} alt={file.name} className="w-full h-44 object-contain bg-background" />
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatBytes(file.size)} • {file.type.replace("image/", "").toUpperCase()}
                    </p>
                  </div>
                  {!mutation.isPending && (
                    <button
                      onClick={reset}
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {mutation.isPending ? (
                  <div className="mt-6 space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Analyzing image and recognizing characters... {progress}%
                    </p>
                  </div>
                ) : (
                  <div className="mt-auto pt-6">
                    <Button
                      onClick={() => mutation.mutate()}
                      disabled={mutation.isPending}
                      size="lg"
                      className="w-full sm:w-auto shadow-glow"
                    >
                      {mutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Extract Text
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
