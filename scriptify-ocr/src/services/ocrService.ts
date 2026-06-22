import { apiFetch, uploadWithProgress } from "@/lib/apiClient";

export interface OCRJob {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  imageDataUrl: string;
  extractedText: string;
  characterCount: number;
  status: "success" | "failed";
  createdAt: string;
}

// The backend (by design) doesn't store uploaded images — only extracted
// text. We cache the preview image client-side, keyed by the saved
// history id, purely so thumbnails keep working in the History page.
const IMAGE_CACHE_KEY = "ocr_job_images";

function getImageCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function cacheImage(id: string, dataUrl: string) {
  try {
    const cache = getImageCache();
    cache[id] = dataUrl;
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full — non-fatal, thumbnail just won't be cached.
  }
}

function getCachedImage(id: string): string {
  return getImageCache()[id] || "";
}

function removeCachedImage(id: string) {
  const cache = getImageCache();
  delete cache[id];
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

interface ExtractResponse {
  success: boolean;
  text: string;
  character_count: number;
  processing_time: number;
  id?: number | null;
}

interface HistoryItemResponse {
  id: number;
  file_name: string;
  character_count: number;
  created_at: string;
}

interface HistoryDetailResponse extends HistoryItemResponse {
  extracted_text: string;
  processing_time: number;
}

export const ocrService = {
  async extract(opts: {
    userId: string;
    file: File;
    imageDataUrl: string;
    persist?: boolean;
    onProgress?: (n: number) => void;
  }): Promise<OCRJob> {
    const { file, imageDataUrl, onProgress, persist } = opts;

    const formData = new FormData();
    formData.append("file", file);

    // Guests have no token attached (apiClient only attaches one if present),
    // so the backend automatically skips persistence for them.
    const data = await uploadWithProgress<ExtractResponse>(
      "/api/ocr/extract",
      formData,
      onProgress,
    );

    const id = data.id != null ? String(data.id) : `local-${crypto.randomUUID()}`;

    if (persist !== false && data.id != null) {
      cacheImage(id, imageDataUrl);
    }

    return {
      id,
      userId: opts.userId,
      fileName: file.name,
      fileSize: file.size,
      imageDataUrl,
      extractedText: data.text,
      characterCount: data.character_count,
      status: "success",
      createdAt: new Date().toISOString(),
    };
  },

  async list(userId: string): Promise<OCRJob[]> {
    const items = await apiFetch<HistoryItemResponse[]>("/api/history");
    return items.map((j) => ({
      id: String(j.id),
      userId,
      fileName: j.file_name,
      fileSize: 0,
      imageDataUrl: getCachedImage(String(j.id)),
      extractedText: "", // not returned by the list endpoint — see get()
      characterCount: j.character_count,
      status: "success" as const,
      createdAt: j.created_at,
    }));
  },

  async get(id: string): Promise<OCRJob | undefined> {
    try {
      const j = await apiFetch<HistoryDetailResponse>(`/api/history/${id}`);
      return {
        id: String(j.id),
        userId: "",
        fileName: j.file_name,
        fileSize: 0,
        imageDataUrl: getCachedImage(String(j.id)),
        extractedText: j.extracted_text,
        characterCount: j.character_count,
        status: "success",
        createdAt: j.created_at,
      };
    } catch {
      return undefined;
    }
  },

  async remove(id: string) {
    await apiFetch(`/api/history/${id}`, { method: "DELETE" });
    removeCachedImage(id);
  },
};