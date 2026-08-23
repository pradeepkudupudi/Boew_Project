import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeId = "cyber-indigo" | "emerald-matrix" | "neon-violet" | "titanium-blue";

export interface ThemeColors {
  background: string;
  card: string;
  cardElevated: string;
  primary: string;
  primarySubtle: string;
  accent: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  textDim: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  "cyber-indigo": {
    id: "cyber-indigo",
    name: "Cyber Indigo",
    description: "Deep obsidian backdrop with glowing cyan & indigo accents",
    colors: {
      background: "#080c14",
      card: "#0f172a",
      cardElevated: "#1e293b",
      primary: "#06b6d4",
      primarySubtle: "rgba(6, 182, 212, 0.12)",
      accent: "#6366f1",
      border: "#1e293b",
      borderSubtle: "rgba(30, 41, 59, 0.6)",
      text: "#f8fafc",
      textMuted: "#94a3b8",
      textDim: "#64748b",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
  "emerald-matrix": {
    id: "emerald-matrix",
    name: "Emerald Matrix",
    description: "Cyberpunk dark mode with vivid emerald & mint neon highlights",
    colors: {
      background: "#06110d",
      card: "#0c1f18",
      cardElevated: "#132f25",
      primary: "#10b981",
      primarySubtle: "rgba(16, 185, 129, 0.12)",
      accent: "#34d399",
      border: "#14382a",
      borderSubtle: "rgba(20, 56, 42, 0.6)",
      text: "#f8fafc",
      textMuted: "#a7f3d0",
      textDim: "#6ee7b7",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
  "neon-violet": {
    id: "neon-violet",
    name: "Neon Aurora",
    description: "Futuristic midnight palette with electric violet & neon pink glows",
    colors: {
      background: "#0f081d",
      card: "#1a0f30",
      cardElevated: "#28174a",
      primary: "#a855f7",
      primarySubtle: "rgba(168, 85, 247, 0.12)",
      accent: "#ec4899",
      border: "#331c5e",
      borderSubtle: "rgba(51, 28, 94, 0.6)",
      text: "#f8fafc",
      textMuted: "#d8b4fe",
      textDim: "#a855f7",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
  "titanium-blue": {
    id: "titanium-blue",
    name: "Titanium Blue",
    description: "Aerospace slate with sapphire blue & crystal sky elements",
    colors: {
      background: "#0b1329",
      card: "#132040",
      cardElevated: "#1b2c57",
      primary: "#3b82f6",
      primarySubtle: "rgba(59, 130, 246, 0.12)",
      accent: "#38bdf8",
      border: "#1e325c",
      borderSubtle: "rgba(30, 50, 92, 0.6)",
      text: "#f8fafc",
      textMuted: "#93c5fd",
      textDim: "#60a5fa",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
};

interface ThemeContextType {
  themeId: ThemeId;
  theme: ThemeDefinition;
  colors: ThemeColors;
  setThemeId: (id: ThemeId) => void;
}

const STORAGE_THEME_KEY = "boew_expo_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>("cyber-indigo");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_THEME_KEY).then((saved) => {
      if (saved && THEMES[saved as ThemeId]) {
        setThemeIdState(saved as ThemeId);
      }
    });
  }, []);

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id);
    AsyncStorage.setItem(STORAGE_THEME_KEY, id);
  };

  const theme = THEMES[themeId];

  return (
    <ThemeContext.Provider value={{ themeId, theme, colors: theme.colors, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
