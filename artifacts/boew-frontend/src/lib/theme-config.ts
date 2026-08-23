export type AppTheme = 'cyber-indigo' | 'emerald-matrix' | 'neon-violet' | 'titanium-blue' | 'clean-light';
export type AppFont = 'jakarta' | 'outfit' | 'inter';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  primaryColor: string;
  bgColor: string;
  accentColor: string;
  isDark: boolean;
}

export interface FontOption {
  id: AppFont;
  name: string;
  fontFamily: string;
  sample: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'cyber-indigo',
    name: 'Cyber Indigo (Default)',
    description: 'Deep obsidian backdrop with glowing cyan & electric indigo accents',
    primaryColor: '#06b6d4',
    bgColor: '#080c14',
    accentColor: '#6366f1',
    isDark: true,
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    description: 'Cyberpunk dark mode with vivid emerald & mint neon highlights',
    primaryColor: '#10b981',
    bgColor: '#06110d',
    accentColor: '#34d399',
    isDark: true,
  },
  {
    id: 'neon-violet',
    name: 'Neon Aurora',
    description: 'Futuristic midnight palette with electric violet & neon magenta glows',
    primaryColor: '#a855f7',
    bgColor: '#0f081d',
    accentColor: '#ec4899',
    isDark: true,
  },
  {
    id: 'titanium-blue',
    name: 'Titanium Blue',
    description: 'Sleek aerospace slate with sapphire blue & crystal sky accents',
    primaryColor: '#3b82f6',
    bgColor: '#0b1329',
    accentColor: '#38bdf8',
    isDark: true,
  },
  {
    id: 'clean-light',
    name: 'Clean Light',
    description: 'Ultra-crisp high contrast light aesthetic with deep sapphire elements',
    primaryColor: '#2563eb',
    bgColor: '#f8fafc',
    accentColor: '#0ea5e9',
    isDark: false,
  },
];

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    fontFamily: '"Plus Jakarta Sans", "JetBrains Mono", sans-serif',
    sample: 'Modern, balanced tech aesthetic',
  },
  {
    id: 'outfit',
    name: 'Outfit',
    fontFamily: '"Outfit", "JetBrains Mono", sans-serif',
    sample: 'Futuristic geometric curves',
  },
  {
    id: 'inter',
    name: 'Inter',
    fontFamily: '"Inter", "JetBrains Mono", sans-serif',
    sample: 'Clean, high-precision typography',
  },
];

const STORAGE_THEME_KEY = 'boew_app_theme';
const STORAGE_FONT_KEY = 'boew_app_font';

export function getStoredTheme(): AppTheme {
  const saved = localStorage.getItem(STORAGE_THEME_KEY) as AppTheme;
  if (saved && THEME_OPTIONS.some(t => t.id === saved)) {
    return saved;
  }
  return 'cyber-indigo';
}

export function getStoredFont(): AppFont {
  const saved = localStorage.getItem(STORAGE_FONT_KEY) as AppFont;
  if (saved && FONT_OPTIONS.some(f => f.id === saved)) {
    return saved;
  }
  return 'jakarta';
}

export function applyTheme(theme: AppTheme): void {
  localStorage.setItem(STORAGE_THEME_KEY, theme);
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  
  const themeObj = THEME_OPTIONS.find(t => t.id === theme);
  if (themeObj && !themeObj.isDark) {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }

  // Update theme-color meta tag for Android status bar
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme && themeObj) {
    metaTheme.setAttribute('content', themeObj.bgColor);
  }
}

export function applyFont(font: AppFont): void {
  localStorage.setItem(STORAGE_FONT_KEY, font);
  document.documentElement.setAttribute('data-font', font);
}

export function initThemeAndFont(): void {
  applyTheme(getStoredTheme());
  applyFont(getStoredFont());
}
