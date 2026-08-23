import { Capacitor } from "@capacitor/core";
import { setBaseUrl as setClientBaseUrl } from "@workspace/api-client-react";

export const STORAGE_KEY_API_BASE_URL = "boew_api_base_url";

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function getDefaultApiBaseUrl(): string {
  const isNative = isNativePlatform();
  const saved = localStorage.getItem(STORAGE_KEY_API_BASE_URL);
  
  if (saved) {
    const clean = saved.replace(/\/+$/, "");
    // If running on web browser, remove stale emulator IP (10.0.2.2)
    if (!isNative && clean.includes("10.0.2.2")) {
      localStorage.removeItem(STORAGE_KEY_API_BASE_URL);
      return "";
    }
    return clean;
  }
  
  if (isNative) {
    return "http://10.0.2.2:5000";
  }
  return "";
}

let currentApiBaseUrl = getDefaultApiBaseUrl();

// Initialize client base URL
if (currentApiBaseUrl) {
  setClientBaseUrl(currentApiBaseUrl);
}

export function getApiBaseUrl(): string {
  return currentApiBaseUrl;
}

export function setApiBaseUrl(url: string): void {
  const cleanUrl = url ? url.trim().replace(/\/+$/, "") : "";
  currentApiBaseUrl = cleanUrl;
  
  if (cleanUrl) {
    localStorage.setItem(STORAGE_KEY_API_BASE_URL, cleanUrl);
    setClientBaseUrl(cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY_API_BASE_URL);
    setClientBaseUrl(null);
  }
  
  window.dispatchEvent(new CustomEvent("boew_api_url_changed", { detail: cleanUrl }));
}

export function resolveApiUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

export async function testServerConnection(targetUrl?: string): Promise<{ success: boolean; latencyMs?: number; error?: string; status?: number }> {
  const base = targetUrl !== undefined ? targetUrl.trim().replace(/\/+$/, "") : getApiBaseUrl();
  const healthUrl = `${base}/api/healthz`;
  
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);
    
    if (response.ok) {
      return { success: true, latencyMs, status: response.status };
    } else {
      return { success: false, latencyMs, error: `HTTP ${response.status} ${response.statusText}`, status: response.status };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      latencyMs,
      error: err.name === "AbortError" ? "Connection timed out (5s)" : err.message || "Failed to connect",
    };
  }
}
