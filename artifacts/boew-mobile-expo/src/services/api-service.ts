import axios from "axios";
import { getStoredApiUrl } from "./api-config";

export interface DatasetStats {
  totalImages: number;
  indexedImages: number;
  categories: Array<{ name: string; count: number }>;
  totalSizeMb: number;
}

export interface DatasetImageItem {
  id: number;
  filename: string;
  originalName: string;
  path: string;
  category: string | null;
  fileSize: number | null;
  hasFeatures: boolean;
  uploadedAt: string;
}

export interface RetrievalResultItem {
  rank: number;
  imageId: number;
  filename: string;
  path: string;
  category: string | null;
  similarityScore: number;
  distance: number;
  metric?: string;
}

export interface RetrievalResponse {
  historyId: number;
  queryImagePath: string;
  results: RetrievalResultItem[];
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    mAP: number;
    retrievalTimeMs: number;
  };
  retrievalTimeMs: number;
}

export interface HistoryItem {
  id: number;
  queryImagePath: string;
  topK: number;
  metric: string;
  retrievalTimeMs: number;
  createdAt: string;
  resultCount: number;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  mAP: number | null;
  results?: RetrievalResultItem[];
}

export const ApiService = {
  async getDatasetStats(): Promise<DatasetStats> {
    const base = await getStoredApiUrl();
    const res = await axios.get(`${base}/api/dataset/stats`, { timeout: 6000 });
    return res.data;
  },

  async getDatasetImages(page = 1, limit = 30): Promise<{ images: DatasetImageItem[]; total: number }> {
    const base = await getStoredApiUrl();
    const res = await axios.get(`${base}/api/dataset/images`, {
      params: { page, limit },
      timeout: 6000,
    });
    return res.data;
  },

  async deleteDatasetImage(id: number): Promise<void> {
    const base = await getStoredApiUrl();
    await axios.delete(`${base}/api/dataset/images/${id}`, { timeout: 6000 });
  },

  async uploadImages(
    files: Array<{ uri: string; name: string; type?: string }>,
    category?: string
  ): Promise<{ uploaded: number; indexed: number; failed: number }> {
    const base = await getStoredApiUrl();
    const formData = new FormData();

    files.forEach((file) => {
      // React Native FormData file signature
      const filePayload: any = {
        uri: file.uri,
        name: file.name || `img_${Date.now()}.jpg`,
        type: file.type || "image/jpeg",
      };
      formData.append("images", filePayload);
    });

    if (category?.trim()) {
      formData.append("category", category.trim());
    }

    const res = await axios.post(`${base}/api/dataset/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    });

    return res.data;
  },

  async executeRetrieval(
    image: { uri: string; name?: string; type?: string },
    topK = 10,
    metric = "cosine"
  ): Promise<RetrievalResponse> {
    const base = await getStoredApiUrl();
    const formData = new FormData();

    const filePayload: any = {
      uri: image.uri,
      name: image.name || `query_${Date.now()}.jpg`,
      type: image.type || "image/jpeg",
    };
    formData.append("image", filePayload);
    formData.append("topK", String(topK));
    formData.append("metric", metric);

    const res = await axios.post(`${base}/api/retrieve`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    });

    return res.data;
  },

  async getHistory(page = 1, limit = 20): Promise<{ history: HistoryItem[]; total: number }> {
    const base = await getStoredApiUrl();
    const res = await axios.get(`${base}/api/history`, {
      params: { page, limit },
      timeout: 6000,
    });
    return res.data;
  },

  async testConnection(targetUrl?: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const base = targetUrl || (await getStoredApiUrl());
    const start = Date.now();
    try {
      await axios.get(`${base}/api/healthz`, { timeout: 4000 });
      const latencyMs = Date.now() - start;
      return { success: true, latencyMs };
    } catch (e: any) {
      const latencyMs = Date.now() - start;
      return { success: false, latencyMs, error: e.message || "Failed to connect" };
    }
  },
};
