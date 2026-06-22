import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

export function UploadZone({ onFile }: { onFile: (file: File, dataUrl: string) => void }) {
  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      if (rejected.length) {
        const err = rejected[0].errors?.[0];
        toast.error(err?.code === "file-too-large" ? "File exceeds 10 MB" : "Unsupported file type");
        return;
      }
      const file = accepted[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onFile(file, reader.result as string);
      reader.readAsDataURL(file);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative cursor-pointer rounded-xl border-2 border-dashed transition-all",
        "px-6 py-16 md:py-20 flex flex-col items-center justify-center text-center",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
      )}
    >
      <input {...getInputProps()} />
      <div
        className={cn(
          "grid h-14 w-14 place-items-center rounded-full mb-4 transition-colors",
          isDragActive ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground group-hover:text-primary",
        )}
      >
        {isDragActive ? <ImageIcon className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold">
        {isDragActive ? "Drop your image here" : "Drag & drop an image"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        or <span className="text-primary font-medium">browse files</span>
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        PNG, JPG, JPEG or WEBP • Max 10 MB
      </p>
    </div>
  );
}
