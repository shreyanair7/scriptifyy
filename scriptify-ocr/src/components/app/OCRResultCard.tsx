import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import type { OCRJob } from "@/services/ocrService";

export function OCRResultCard({ job, onNew }: { job: OCRJob; onNew?: () => void }) {
  const copy = async () => {
    await navigator.clipboard.writeText(job.extractedText);
    toast.success("Text copied to clipboard");
  };

  const downloadTxt = () => {
    const blob = new Blob([job.extractedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${job.fileName.replace(/\.[^.]+$/, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const margin = 48;
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const lines = doc.splitTextToSize(job.extractedText, maxWidth);
    let y = margin;
    const lineHeight = 14;
    const pageHeight = doc.internal.pageSize.getHeight() - margin;
    lines.forEach((line: string) => {
      if (y > pageHeight) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });
    doc.save(`${job.fileName.replace(/\.[^.]+$/, "")}.pdf`);
  };

  return (
    <Card className="shadow-soft overflow-hidden">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-2 gap-0">
          <div className="bg-muted/40 p-6 border-b lg:border-b-0 lg:border-r border-border">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Source image
            </p>
            <div className="rounded-lg overflow-hidden bg-background border border-border">
              <img
                src={job.imageDataUrl}
                alt={job.fileName}
                className="w-full h-auto max-h-[480px] object-contain"
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground truncate">{job.fileName}</p>
          </div>

          <div className="p-6 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Extracted text
              </p>
              <span className="text-xs text-muted-foreground">
                {job.extractedText.length} chars
              </span>
            </div>
            <Textarea
              value={job.extractedText}
              readOnly
              className="flex-1 min-h-[280px] resize-none font-mono text-sm leading-relaxed bg-background"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={copy} variant="secondary" size="sm">
                <Copy className="h-4 w-4 mr-1.5" /> Copy
              </Button>
              <Button onClick={downloadTxt} variant="secondary" size="sm">
                <FileText className="h-4 w-4 mr-1.5" /> .TXT
              </Button>
              <Button onClick={downloadPdf} variant="secondary" size="sm">
                <Download className="h-4 w-4 mr-1.5" /> .PDF
              </Button>
              {onNew && (
                <Button onClick={onNew} size="sm" className="ml-auto">
                  New Extraction
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
