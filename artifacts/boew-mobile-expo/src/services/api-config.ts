import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const STORAGE_KEY_API_URL = "boew_expo_api_url";

export const DEFAULT_PRESETS = [
  {
    name: "ADB Reverse / Localhost",
    url: "http://localhost:5000",
    desc: "Direct USB cable via adb reverse tcp:5000",
  },
  {
    name: "Host PC Wi-Fi Network",
    url: "http://10.215.229.26:5000",
    desc: "Local Wi-Fi IP address of host computer",
  },
  {
    name: "Android Emulator (AVD)",
    url: "http://10.0.2.2:5000",
    desc: "Default host IP inside Android Emulator",
  },
];

export async function getStoredApiUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_API_URL);
    if (saved) return saved.trim().replace(/\/+$/, "");
  } catch {}
  
  if (Platform.OS === "android") {
    return "http://10.215.229.26:5000";
  }
  return "http://localhost:5000";
}

export async function saveApiUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, "");
  await AsyncStorage.setItem(STORAGE_KEY_API_URL, clean);
}

export function resolveImageUri(serverUrl: string, imagePath: string): string {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("file://")) {
    return imagePath;
  }
  const cleanBase = serverUrl.trim().replace(/\/+$/, "");
  const normalized = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${cleanBase}/api/images${normalized}`;
}

export function resolveUploadImageUri(serverUrl: string, imagePath: string): string {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("file://")) {
    return imagePath;
  }
  const cleanBase = serverUrl.trim().replace(/\/+$/, "");
  const normalized = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${cleanBase}/api/uploads${normalized}`;
}
